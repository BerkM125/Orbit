/**
 * Fetches all user profiles and transforms them to match the demoRoom users structure.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @returns {Promise<Array>} Array of transformed user profile objects
 */
async function getAllUserProfiles(supabase) {
	// Default values for required fields
	const DEFAULT_LOCATION = {
		latitude: 47.6062, // Default to Seattle
		longitude: -122.3321
	};

	const { data, error } = await supabase
		.from('documents')
		.select(
			'id, first_name, last_name, linkedin_url, bio, headshot_image, created_at, updated_at, latitude, longitude'
		);

	if (error) {
		console.error('Error fetching user profiles:', error.message);
		return [];
	}

	// Transform Supabase user profiles to match demoRoom users structure
	const transformedUsers = data.map((profile) => ({
		// Use the Supabase UUID as id
		id: profile.id,
		// Use separate name fields
		first_name: profile.first_name,
		last_name: profile.last_name,
		// Include additional profile info with defaults
		profileInfo: {
			linkedIn: profile.linkedin_url || `https://linkedin.com/in/user-${profile.id}`,
			bio: profile.bio || '',
			headshot: profile.headshot,
			joinedAt: profile.created_at,
			lastActive: profile.updated_at
		},
		// Use actual location data from Supabase, only fall back to defaults if necessary
		location: {
			latitude:
				typeof profile.latitude === 'number' ? profile.latitude : DEFAULT_LOCATION.latitude,
			longitude:
				typeof profile.longitude === 'number'
					? profile.longitude
					: DEFAULT_LOCATION.longitude
		}
	}));

	return transformedUsers;
}

/**
 * Syncs the current demoRoom user data back to Supabase.
 * Updates documents table with latest user information.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {Array} users - Array of user objects from demoRoom
 */
async function syncRoomDataToSupabase(supabase, users) {
	// Process each user in parallel
	const updatePromises = users.map(async (user) => {
		// Skip users without a valid id (temporary socket-only users)
		if (!user.id) {
			return;
		}

		// Use the user's separate name fields
		const first_name = user.first_name || 'Anonymous';
		const last_name = user.last_name || 'User';

		// Default values for required fields
		const DEFAULT_HEADSHOT =
			'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg';
		const DEFAULT_LOCATION = {
			latitude: 47.6062, // Default to Seattle
			longitude: -122.3321
		};

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
			headshot_image: user.profileInfo?.headshot,
			// Get location from user object, handling both possible structures
			latitude:
				typeof user.location?.latitude === 'number'
					? user.location.latitude
					: DEFAULT_LOCATION.latitude,
			longitude:
				typeof user.location?.longitude === 'number'
					? user.location.longitude
					: DEFAULT_LOCATION.longitude,
			// Always update the timestamp
			updated_at: new Date().toISOString()
		};

		// Update the user profile in Supabase
		const { error } = await supabase.from('documents').update(userData).eq('id', user.id);

		if (error) {
			console.error(`Error updating user ${user.id}:`, error.message);
		}
	});

	// Wait for all updates to complete
	await Promise.all(updatePromises);
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
	const hasValidExtension = validExtensions.some((ext) => url.toLowerCase().endsWith(ext));

	return hasValidExtension ? url : null;
}

/**
 * Creates or updates a user profile in Supabase.
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {Object} userData - User data from the client
 * @returns {Promise<Object>} The created/updated user profile with UUID
 */
async function createOrUpdateUserProfile(supabase, userData) {
	// Use provided first_name/last_name with defaults
	const first_name = userData.first_name || 'Anonymous';
	const last_name = userData.last_name || 'User';

	// Default values for required fields
	const DEFAULT_LOCATION = {
		latitude: 47.6062, // Default to Seattle
		longitude: -122.3321
	};

	// Validate and prepare the headshot URL
	const validatedHeadshot = validateHeadshotUrl(userData.headshot_image);

	// Default values for required fields
	const DEFAULT_LINKEDIN = `https://linkedin.com/in/user-${Date.now()}`; // Unique default LinkedIn URL

	// Get location from userData, ensuring we handle both possible structures
	const location = userData.location || {};
	const latitude =
		typeof location.latitude === 'number'
			? location.latitude
			: typeof userData.latitude === 'number'
			? userData.latitude
			: DEFAULT_LOCATION.latitude;
	const longitude =
		typeof location.longitude === 'number'
			? location.longitude
			: typeof userData.longitude === 'number'
			? userData.longitude
			: DEFAULT_LOCATION.longitude;

	// Generate a unique phone number if none provided (XXX-XXX-XXXX format)
	const randomPhoneDigits = Math.floor(Math.random() * 10000000)
		.toString()
		.padStart(7, '0');
	const DEFAULT_PHONE = `206-${randomPhoneDigits.slice(0, 3)}-${randomPhoneDigits.slice(3)}`;

	// Prepare the user data in Supabase format
	const supabaseUser = {
		first_name,
		last_name: last_name || 'User', // Fallback to 'User' if last_name is empty
		// LinkedIn URL is required - provide a unique default if none exists
		linkedin_url: userData.linkedin_url || DEFAULT_LINKEDIN,
		bio: userData.bio || '',
		// Always provide a valid headshot image
		headshot_image: userData.headshot_image,
		// Required phone number
		phone_number: userData.phone_number || DEFAULT_PHONE,
		// Required location fields
		latitude,
		longitude,
		updated_at: new Date().toISOString()
	};

	let existingUser;

	// First try to find user by LinkedIn URL if provided
	if (userData.linkedin_url) {
		const { data: linkedInUser } = await supabase
			.from('documents')
			.select()
			.ilike('linkedin_url', userData.linkedin_url)
			.single();

		if (linkedInUser) {
			existingUser = linkedInUser;
			// Update the existing user's data
			const { data, error } = await supabase
				.from('documents')
				.update(supabaseUser)
				.eq('id', linkedInUser.id)
				.select()
				.single();

			if (!error) {
				existingUser = data;
			}
			return {
				...userData,
				id: existingUser.id,
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
	if (
		!existingUser &&
		userData.id &&
		userData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
	) {
		const { data, error } = await supabase
			.from('documents')
			.update(supabaseUser)
			.eq('id', userData.id)
			.select()
			.single();

		if (!error) {
			existingUser = data;
		}
	}

	// If no UUID or update failed, create new user
	if (!existingUser) {
		const { data, error } = await supabase
			.from('documents')
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
		id: existingUser.id,
		location: {
			latitude: existingUser.latitude,
			longitude: existingUser.longitude
		},
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
