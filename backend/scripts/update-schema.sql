-- Add company column to documents table
ALTER TABLE documents 
ADD COLUMN company VARCHAR(100);

-- Add location columns to documents table
ALTER TABLE documents 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Create index on location for faster geographic queries
CREATE INDEX idx_documents_location ON documents (latitude, longitude);

-- Update existing records with sample data (run this after adding columns)
-- This will be handled by the update script
