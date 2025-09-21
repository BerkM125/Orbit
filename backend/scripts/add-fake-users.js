const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Base coordinates from the image (47.634344468, -122.33981586)
const baseLatitude = 47.634344468;
const baseLongitude = -122.33981586;

// Function to generate slight variations in coordinates
function generateCoordinates(index) {
  // Add small random variations (about 0.001 degrees ≈ 100m)
  const latVariation = (Math.random() - 0.5) * 0.002;
  const lngVariation = (Math.random() - 0.5) * 0.002;
  
  return {
    latitude: baseLatitude + latVariation,
    longitude: baseLongitude + lngVariation
  };
}

// Fake user data
const fakeUsers = [
  {
    first_name: "Derek",
    last_name: "Yao",
    linkedin_url: "https://www.linkedin.com/in/derek-yao-72b5b42a8/",
    bio: "Student at Allen School",
    company: "University of Washington",
    phone_number: "425-522-3218",
    headshot_image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg"
  },
  {
    first_name: "Ben",
    last_name: "Hu", 
    linkedin_url: "https://www.linkedin.com/in/ben-hu-uw/",
    bio: "Student at Allen School",
    company: "University of Washington",
    phone_number: "425-522-3218",
    headshot_image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg"
  },
  {
    first_name: "Yifan",
    last_name: "Wen",
    linkedin_url: "https://www.linkedin.com/in/yifan-wen-uw/",
    bio: "Student at Allen School", 
    company: "University of Washington",
    phone_number: "425-522-3218",
    headshot_image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg"
  },
  {
    first_name: "Berkan",
    last_name: "Mertan",
    linkedin_url: "https://www.linkedin.com/in/berkan-mertan-uw/",
    bio: "Student at Allen School",
    company: "University of Washington", 
    phone_number: "425-522-3218",
    headshot_image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg"
  },
  {
    first_name: "Raymond",
    last_name: "Chen",
    linkedin_url: "https://www.linkedin.com/in/raymond-chen-cascadia/",
    bio: "Student at Allen School",
    company: "Cascadia",
    phone_number: "425-522-3218", 
    headshot_image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg"
  }
];

async function addFakeUsers() {
  console.log('🚀 Adding fake users to Supabase...');
  
  try {
    let addedCount = 0;
    let updatedCount = 0;
    
    // Process each user individually
    for (let i = 0; i < fakeUsers.length; i++) {
      const user = fakeUsers[i];
      const coords = generateCoordinates(i);
      
      const userData = {
        ...user,
        latitude: coords.latitude,
        longitude: coords.longitude,
        updated_at: new Date().toISOString()
      };

      console.log(`📝 Processing ${user.first_name} ${user.last_name}...`);
      
      // Check if user already exists by LinkedIn URL
      const { data: existingUser } = await supabase
        .from('documents')
        .select('id')
        .ilike('linkedin_url', user.linkedin_url)
        .single();

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('documents')
          .update(userData)
          .eq('id', existingUser.id)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error updating ${user.first_name} ${user.last_name}:`, error.message);
        } else {
          console.log(`✅ Updated ${user.first_name} ${user.last_name} (${user.company}) - Lat: ${userData.latitude.toFixed(6)}, Lng: ${userData.longitude.toFixed(6)}`);
          updatedCount++;
        }
      } else {
        // Insert new user
        const { data, error } = await supabase
          .from('documents')
          .insert([{
            ...userData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error(`❌ Error adding ${user.first_name} ${user.last_name}:`, error.message);
        } else {
          console.log(`✅ Added ${user.first_name} ${user.last_name} (${user.company}) - Lat: ${userData.latitude.toFixed(6)}, Lng: ${userData.longitude.toFixed(6)}`);
          addedCount++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Added: ${addedCount} new users`);
    console.log(`  - Updated: ${updatedCount} existing users`);
    console.log(`  - Total processed: ${addedCount + updatedCount} users`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run the script
addFakeUsers();
