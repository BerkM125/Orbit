require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Seattle area coordinates (diverse locations around the city)
const seattleCoordinates = [
  { lat: 47.6062, lng: -122.3321 }, // Downtown Seattle
  { lat: 47.6205, lng: -122.3493 }, // Queen Anne
  { lat: 47.6080, lng: -122.3351 }, // Capitol Hill
  { lat: 47.6148, lng: -122.3158 }, // Central District
  { lat: 47.5925, lng: -122.3306 }, // Beacon Hill
  { lat: 47.6611, lng: -122.3136 }, // Fremont
  { lat: 47.6740, lng: -122.3035 }, // Ballard
  { lat: 47.6205, lng: -122.3493 }, // Belltown
  { lat: 47.6080, lng: -122.3351 }, // First Hill
  { lat: 47.5925, lng: -122.3306 }, // International District
  { lat: 47.6611, lng: -122.3136 }, // Wallingford
  { lat: 47.6740, lng: -122.3035 }, // Greenwood
  { lat: 47.6205, lng: -122.3493 }, // South Lake Union
  { lat: 47.6080, lng: -122.3351 }, // Madison Park
  { lat: 47.5925, lng: -122.3306 }, // Rainier Valley
  { lat: 47.6611, lng: -122.3136 }, // University District
  { lat: 47.6740, lng: -122.3035 }, // Phinney Ridge
  { lat: 47.6205, lng: -122.3493 }, // West Seattle
  { lat: 47.6080, lng: -122.3351 }, // Magnolia
  { lat: 47.5925, lng: -122.3306 }, // Georgetown
  { lat: 47.6611, lng: -122.3136 }, // Green Lake
  { lat: 47.6740, lng: -122.3035 }, // Crown Hill
  { lat: 47.6205, lng: -122.3493 }, // Alki
  { lat: 47.6080, lng: -122.3351 }, // Leschi
  { lat: 47.5925, lng: -122.3306 }  // SoDo
];

// Tech companies in Seattle area
const companies = [
  "Amazon", "Microsoft", "Google", "Meta", "Apple", "Salesforce", "Adobe", "Oracle",
  "Tableau", "Zillow", "Expedia", "T-Mobile", "Boeing", "Starbucks", "Nordstrom",
  "REI", "Costco", "F5 Networks", "DocuSign", "Smartsheet", "Remitly", "OfferUp",
  "Redfin", "Chewy", "Rover", "Auth0", "Convoy", "Outreach", "PitchBook"
];

async function updateUserProfiles() {
  try {
    console.log('🔄 Updating user profiles with company and location data...');
    
    // Get all existing profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('documents')
      .select('id, first_name, last_name');
    
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} profiles to update`);
    
    // Update each profile with random company and location
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = seattleCoordinates[i % seattleCoordinates.length];
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          company: company,
          latitude: location.lat,
          longitude: location.lng
        })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${profile.first_name} ${profile.last_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${profile.first_name} ${profile.last_name} - ${company} at (${location.lat}, ${location.lng})`);
      }
    }
    
    console.log('\n🎉 All profiles updated successfully!');
    
    // Verify the updates
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('documents')
      .select('first_name, last_name, company, latitude, longitude')
      .limit(5);
    
    if (!verifyError && updatedProfiles) {
      console.log('\n📋 Sample updated profiles:');
      updatedProfiles.forEach(profile => {
        console.log(`${profile.first_name} ${profile.last_name} - ${profile.company} at (${profile.latitude}, ${profile.longitude})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in update process:', error);
  }
}

updateUserProfiles();
