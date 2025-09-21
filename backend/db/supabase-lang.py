from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import Client, create_client
from langflow.base.vectorstores.model import LCVectorStoreComponent, check_cached_vector_store
from langflow.helpers.data import docs_to_data
from langflow.io import HandleInput, IntInput, SecretStrInput, StrInput
from langflow.schema.data import Data
from langchain_core.documents import Document
import numpy as np

class SupabaseVectorStoreComponent(LCVectorStoreComponent):
    display_name = "Supabase"
    description = "Supabase Vector Store with search capabilities for user_profiles table"
    name = "SupabaseVectorStore"
    icon = "Supabase"
    
    inputs = [
        StrInput(name="supabase_url", display_name="Supabase URL", required=True),
        SecretStrInput(name="supabase_service_key", display_name="Supabase Service Key", required=True),
        StrInput(
            name="table_name", 
            display_name="Table Name", 
            value="documents",
            info="Name of the table to search"
        ),
        StrInput(
            name="content_field", 
            display_name="Content Field",
            value="bio",
            info="Field to use as content for search (bio, first_name, company, etc.)"
        ),
        *LCVectorStoreComponent.inputs,
        HandleInput(name="embedding", display_name="Embedding", input_types=["Embeddings"]),
        IntInput(
            name="number_of_results",
            display_name="Number of Results",
            info="Number of results to return.",
            value=4,
            advanced=True,
        ),
    ]

    @check_cached_vector_store
    def build_vector_store(self) -> None:
        """Initialize Supabase client"""
        self.supabase_client = create_client(self.supabase_url, supabase_key=self.supabase_service_key)
        return None

    def search_documents(self) -> list[Data]:
        try:
            if not hasattr(self, 'supabase_client'):
                self.supabase_client = create_client(self.supabase_url, supabase_key=self.supabase_service_key)
            
            if not self.search_query or not isinstance(self.search_query, str) or not self.search_query.strip():
                self.status = []
                return []

            # Get embedding for the search query
            query_embedding = self.embedding.embed_query(self.search_query)
            
            # Fetch all records with embeddings from the table
            try:
                result = self.supabase_client.table(self.table_name).select("*").not_.is_("embedding", "null").execute()
                
                # Check if result contains actual data or error response
                if hasattr(result, 'data') and isinstance(result.data, list):
                    data = result.data
                elif hasattr(result, 'data') and isinstance(result.data, dict) and 'swagger' in result.data:
                    raise ValueError("Authentication failed or table access denied. Check your service key and table permissions.")
                else:
                    raise ValueError(f"Unexpected response format: {type(result.data)}")
                    
            except Exception as db_error:
                error_str = str(db_error)
                if 'swagger' in error_str or 'openapi' in error_str:
                    raise ValueError("Authentication failed or table access denied. Please check your Supabase service key and ensure the table has proper RLS policies.")
                else:
                    raise ValueError(f"Database query failed: {error_str}")
            
            if data:
                # Calculate similarities client-side
                scored_results = []
                for row in data:
                    if row.get('embedding'):
                        try:
                            # Convert embedding to numpy array for calculation
                            row_embedding = np.array(row['embedding'])
                            query_emb = np.array(query_embedding)
                            
                            # Calculate cosine similarity
                            dot_product = np.dot(query_emb, row_embedding)
                            norm_query = np.linalg.norm(query_emb)
                            norm_row = np.linalg.norm(row_embedding)
                            
                            # Avoid division by zero
                            if norm_query > 0 and norm_row > 0:
                                similarity = dot_product / (norm_query * norm_row)
                            else:
                                similarity = 0.0
                            
                            # Add similarity to row data
                            row['similarity'] = float(similarity)
                            scored_results.append(row)
                            
                        except Exception as calc_error:
                            # Skip this row if embedding calculation fails
                            continue
                
                # Sort by similarity (highest first) and take top results
                scored_results.sort(key=lambda x: x['similarity'], reverse=True)
                top_results = scored_results[:self.number_of_results]
                
                documents = []
                for row in top_results:
                    # Create document content from specified field
                    content = str(row.get(self.content_field, '')) or ''
                    
                    # Create metadata from other fields
                    metadata = {
                        'id': str(row.get('id', '')),
                        'first_name': row.get('first_name'),
                        'last_name': row.get('last_name'),
                        'company': row.get('company'),
                        'linkedin_url': row.get('linkedin_url'),
                        'phone_number': row.get('phone_number'),
                        'latitude': row.get('latitude'),
                        'longitude': row.get('longitude'),
                        'headshot_image': row.get('headshot_image'),
                        'created_at': str(row.get('created_at', '')),
                        'updated_at': str(row.get('updated_at', '')),
                        'similarity': round(row.get('similarity', 0), 4),
                    }
                    
                    # Remove None values from metadata
                    metadata = {k: v for k, v in metadata.items() if v is not None and v != ''}
                    
                    # Create Document object
                    doc = Document(page_content=content, metadata=metadata)
                    documents.append(doc)
                
                data_result = docs_to_data(documents)
                self.status = data_result
                return data_result
            else:
                self.status = []
                return []
                
        except Exception as e:
            error_msg = f"Error searching documents: {str(e)}"
            self.status = error_msg
            raise ValueError(error_msg)