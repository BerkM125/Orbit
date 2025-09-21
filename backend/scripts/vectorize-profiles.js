require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Function to parse user profiles from the JSON file
function parseUserProfiles(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const profiles = JSON.parse(content);

  console.log(`📄 Found ${profiles.length} profiles in JSON file`);

  // Validate that all profiles have required fields
  const validProfiles = profiles.filter(profile => {
    const isValid = profile.firstName && profile.lastName && profile.bio;
    if (!isValid) {
      console.log(`❌ Skipped invalid profile: ${JSON.stringify(profile)}`);
    }
    return isValid;
  });

  console.log(`✅ ${validProfiles.length} valid profiles found`);
  return validProfiles;
}

// Function to create embedding using OpenAI
async function createEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

// Function to insert profile into Supabase
async function insertProfile(profile, embedding) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        first_name: profile.firstName,
        last_name: profile.lastName,
        linkedin_url: profile.linkedinUrl,
        bio: profile.bio,
        headshot_image: profile.headshotImage,
        embedding: embedding
      });
    
    if (error) {
      console.error('Error inserting profile:', error);
      throw error;
    }

    console.log(`✅ Inserted profile for ${profile.firstName} ${profile.lastName}`);
    return data;
  } catch (error) {
    console.error('Error inserting profile:', error);
    throw error;
  }
}

// Main function to process all profiles
async function vectorizeAndStoreProfiles() {
  try {
    console.log('🚀 Starting profile vectorization...');

    // Parse profiles from JSON file
    const profilesPath = path.join(__dirname, '../db/sample-user-profiles.json');
    const profiles = parseUserProfiles(profilesPath);

    console.log(`📊 Found ${profiles.length} profiles to process`);

    // Process each profile
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`\n🔄 Processing ${i + 1}/${profiles.length}: ${profile.firstName} ${profile.lastName}`);

      // Create embedding for the bio
      const embedding = await createEmbedding(profile.bio);
      console.log(`📊 Created embedding with ${embedding.length} dimensions`);

      // Insert into Supabase
      await insertProfile(profile, embedding);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 All profiles successfully vectorized and stored!');
  } catch (error) {
    console.error('❌ Error in vectorization process:', error);
  }
}

vectorizeAndStoreProfiles();
