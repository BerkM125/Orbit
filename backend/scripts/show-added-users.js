const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function showAddedUsers() {
  console.log('🔍 Showing the fake users we just added...');
  
  try {
    // Get the users we added (by their specific names)
    const names = ['Derek Yao', 'Ben Hu', 'Yifan Wen', 'Berkan Mertan', 'Raymond Chen'];
    
    for (const name of names) {
      const [firstName, lastName] = name.split(' ');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (error) {
        console.log(`❌ Could not find ${name}`);
      } else {
        console.log(`\n👤 ${data.first_name} ${data.last_name}:`);
        console.log(`   Company: ${data.company || 'N/A'}`);
        console.log(`   Bio: ${data.bio || 'N/A'}`);
        console.log(`   Phone: ${data.phone_number || 'N/A'}`);
        console.log(`   LinkedIn: ${data.linkedin_url || 'N/A'}`);
        console.log(`   Location: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`);
        console.log(`   ID: ${data.id}`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run the script
showAddedUsers();
