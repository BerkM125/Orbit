-- Add company column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN company VARCHAR(100);

-- Add location columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Create index on location for faster geographic queries
CREATE INDEX idx_user_profiles_location ON user_profiles (latitude, longitude);

-- Update existing records with sample data (run this after adding columns)
-- This will be handled by the update script
