/**
 * Fetches all user profiles and transforms them to match the demoRoom users structure.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @returns {Promise<Array>} Array of transformed user profile objects
 */
async function getAllUserProfiles(supabase) {
  console.log("Fetching all user profiles...");

  // Default values for required fields
  const DEFAULT_HEADSHOT = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg';
  const DEFAULT_LOCATION = {
    latitude: 47.6062,  // Default to Seattle
    longitude: -122.3321
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, linkedin_url, bio, headshot_image, created_at, updated_at');

  if (error) {
    console.error('Error fetching user profiles:', error.message);
    return [];
  }

  console.log('Successfully fetched user profiles');
  
  // Transform Supabase user profiles to match demoRoom users structure
  const transformedUsers = data.map(profile => ({
    // Use the Supabase UUID as userId
    userId: profile.id,
    // Combine first and last name
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    // Include additional profile info with defaults
    profileInfo: {
      linkedIn: profile.linkedin_url || `https://linkedin.com/in/user-${profile.id}`,
      bio: profile.bio || '',
      headshot: profile.headshot_image || DEFAULT_HEADSHOT,
      joinedAt: profile.created_at,
      lastActive: profile.updated_at
    },
    // Add location with defaults
    location: {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude
    }
  }));

  return transformedUsers;
}

/**
 * Syncs the current demoRoom user data back to Supabase.
 * Updates user_profiles table with latest user information.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {Array} users - Array of user objects from demoRoom
 */
async function syncRoomDataToSupabase(supabase, users) {
  console.log("Syncing room data to Supabase...");

  // Process each user in parallel
  const updatePromises = users.map(async user => {
    // Skip users without a valid userId (temporary socket-only users)
    if (!user.userId) {
      console.log("Skipping user without userId:", user.name);
      return;
    }

    // Split the combined name back into first and last
    const nameParts = user.name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ');

    // Default values for required fields
    const DEFAULT_HEADSHOT = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg';
    const DEFAULT_LOCATION = {
      latitude: 47.6062,  // Default to Seattle
      longitude: -122.3321
    };

    // Validate headshot URL
    const validatedHeadshot = validateHeadshotUrl(user.profileInfo?.headshot);
    if (user.profileInfo?.headshot && !validatedHeadshot) {
      console.warn(`Invalid headshot URL format for user ${user.name}:`, user.profileInfo.headshot);
    }

    // Default LinkedIn URL with timestamp to ensure uniqueness
    const DEFAULT_LINKEDIN = `https://linkedin.com/in/user-${Date.now()}`;

    // Prepare the update data
    const userData = {
      // Required fields
      first_name,
      last_name,
      // LinkedIn URL is required - provide a unique default if none exists
      linkedin_url: user.profileInfo?.linkedIn || DEFAULT_LINKEDIN,
      bio: user.profileInfo?.bio || '',
      headshot_image: validatedHeadshot || DEFAULT_HEADSHOT,
      // Always update the timestamp
      updated_at: new Date().toISOString()
    };

    // Update the user profile in Supabase
    const { error } = await supabase
      .from('user_profiles')
      .update(userData)
      .eq('id', user.userId);

    if (error) {
      console.error(`Error updating user ${user.userId}:`, error.message);
    } else {
      console.log(`Successfully updated user ${user.userId} in Supabase`);
    }
  });

  // Wait for all updates to complete
  await Promise.all(updatePromises);
  console.log("Finished syncing room data to Supabase");
}

/**
 * Validates a headshot image URL to ensure it meets Supabase constraints.
 * @param {string|null} url - The URL to validate
 * @returns {string|null} - Valid URL or null if invalid
 */
function validateHeadshotUrl(url) {
  if (!url) return null;
  
  // Check if URL ends with allowed image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = validExtensions.some(ext => 
    url.toLowerCase().endsWith(ext)
  );
  
  return hasValidExtension ? url : null;
}

/**
 * Creates or updates a user profile in Supabase.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {Object} userData - User data from the client
 * @returns {Promise<Object>} The created/updated user profile with UUID
 */
async function createOrUpdateUserProfile(supabase, userData) {
  console.log("Creating/updating user profile...");

  // Split the name if it exists
  const nameParts = (userData.name || "Anonymous User").split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ');

  // Default values for required fields
  const DEFAULT_HEADSHOT = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg';
  const DEFAULT_LOCATION = {
    latitude: 47.6062,  // Default to Seattle
    longitude: -122.3321
  };

  // Validate and prepare the headshot URL
  const validatedHeadshot = validateHeadshotUrl(userData.headshot_image);
  if (userData.headshot_image && !validatedHeadshot) {
    console.warn('Invalid headshot image URL format:', userData.headshot_image);
  }

  // Default values for required fields
  const DEFAULT_LINKEDIN = `https://linkedin.com/in/user-${Date.now()}`;  // Unique default LinkedIn URL

  // Prepare the user data in Supabase format
  const supabaseUser = {
    first_name,
    last_name,
    // LinkedIn URL is required - provide a unique default if none exists
    linkedin_url: userData.linkedin_url || DEFAULT_LINKEDIN,
    bio: userData.bio || '',
    // Always provide a valid headshot image
    headshot_image: validatedHeadshot || DEFAULT_HEADSHOT,
    updated_at: new Date().toISOString()
  };

  let existingUser;
  
  // First try to find user by LinkedIn URL if provided
  if (userData.linkedin_url) {
    const { data: linkedInUser } = await supabase
      .from('user_profiles')
      .select()
      .ilike('linkedin_url', userData.linkedin_url)
      .single();
    
    if (linkedInUser) {
      console.log("Found existing user by LinkedIn URL");
      existingUser = linkedInUser;
      // Update the existing user's data
      const { data, error } = await supabase
        .from('user_profiles')
        .update(supabaseUser)
        .eq('id', linkedInUser.id)
        .select()
        .single();
      
      if (!error) {
        existingUser = data;
      }
      return {
        ...userData,
        userId: existingUser.id,
        profileInfo: {
          linkedIn: existingUser.linkedin_url,
          bio: existingUser.bio,
          headshot: existingUser.headshot_image,
          joinedAt: existingUser.created_at,
          lastActive: existingUser.updated_at
        }
      };
    }
  }

  // If no LinkedIn match, try UUID if we have one
  if (!existingUser && userData.userId && 
      userData.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(supabaseUser)
      .eq('id', userData.userId)
      .select()
      .single();
    
    if (!error) {
      existingUser = data;
    }
  }

  // If no UUID or update failed, create new user
  if (!existingUser) {
    console.log("Creating new user profile in Supabase");
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([supabaseUser])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error.message);
      throw error;
    }
    existingUser = data;
  }

  // Return the user with their UUID and other fields
  return {
    ...userData,
    userId: existingUser.id,
    profileInfo: {
      linkedIn: existingUser.linkedin_url,
      bio: existingUser.bio,
      headshot: existingUser.headshot_image,
      joinedAt: existingUser.created_at,
      lastActive: existingUser.updated_at
    }
  };
}

module.exports = { getAllUserProfiles, syncRoomDataToSupabase, createOrUpdateUserProfile };