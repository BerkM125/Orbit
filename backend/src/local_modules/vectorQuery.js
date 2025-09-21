const MY_SUPABASE_URL = 'https://uwfnpwmchtnssaejiqep.supabase.co';
const MY_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Zm5wd21jaHRuc3NhZWppcWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTU1ODUsImV4cCI6MjA3MzE5MTU4NX0.3Gc3tlFT3FS7K0QAK_Z03RLkteilqj6Mpu9l3Q2vJ4k';
const MY_OPENAI_KEY = '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';

async function vectorSearch(nlpSearch) {
    supabaseUrl = MY_SUPABASE_URL;
    supabaseKey = MY_SUPABASE_KEY;
    openAiKey = MY_OPENAI_KEY;
    var embeddingResult = await generateVectorForQuery(nlpSearch, openAiKey);
    console.log('Generated embedding:', embeddingResult);
    var searchResults = await search(supabaseUrl, supabaseKey, embeddingResult);
    return searchResults;
}

async function search(supabaseUrl, supabaseKey, queryEmbedding) {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('A valid queryEmbedding vector is required.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
  };

  const payload = {
    name: 'match_documents', 
    params: {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: 5,
    },
  };

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("RAW DATA: ", data);
    return data;
  } catch (error) {
    console.error('An error occurred during the search:', error);
    throw error;
  }
}

async function generateVectorForQuery(query, openAiKey) {
  const openAiUrl = 'https://api.openai.com/v1/embeddings';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openAiKey}`,
  };

  const payload = {
    model: 'text-embedding-ada-002',
    input: query,
  };

  try {
    const response = await fetch(openAiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('An error occurred while generating the vector:', error);
    throw error;
  }
}

module.exports = {
    search,
    generateVectorForQuery,
    vectorSearch
};