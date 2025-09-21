import { supabase } from './supabase.js';

/**
 * Format phone number to XXX-XXX-XXXX
 */
function formatPhoneNumber(phone) {
	const cleaned = phone.replace(/\D/g, '');
	if (cleaned.length !== 10) {
		throw new Error('Phone number must be 10 digits');
	}
	return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Generate OpenAI embedding from text
 */
async function generateEmbedding(text, apiKey) {
	const response = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			input: text,
			model: 'text-embedding-3-small'
		})
	});

	if (!response.ok) {
		throw new Error('Failed to generate embedding');
	}

	const data = await response.json();
	return data.data[0].embedding;
}

/**
 * Upload headshot image to Supabase storage
 */
async function uploadHeadshot(file, id) {
	const fileExt = file.name.split('.').pop();
	const fileName = `${id}_${Date.now()}.${fileExt}`;

	const { data, error } = await supabase.storage.from('headshots').upload(fileName, file);

	if (error) throw error;

	const {
		data: { publicUrl }
	} = supabase.storage.from('headshots').getPublicUrl(fileName);

	return publicUrl;
}

/**
 * Create user profile with embedding
 *
 * @param {Object} profileData
 * @param {string} profileData.firstName
 * @param {string} profileData.lastName
 * @param {string} profileData.linkedinUrl
 * @param {string} profileData.bio
 * @param {string} profileData.phoneNumber
 * @param {string} profileData.company
 * @param {string} profileData.id
 * @param {File} [profileData.headshotFile] - Optional image file
 * @returns {Promise<Object>} Created profile data
 */
export async function createUserProfile(profileData) {
	const { firstName, lastName, linkedinUrl, bio, phoneNumber, company, id, headshotFile } =
		profileData;

	// Validate required fields
	if (!firstName || !lastName || !linkedinUrl || !bio || !phoneNumber || !company || !id) {
		throw new Error('All fields are required');
	}

	// Format phone number
	const formattedPhone = formatPhoneNumber(phoneNumber);

	// Upload headshot if provided
	let headshotUrl = `https://www.gravatar.com/avatar/${id}?d=mp&f=y.jpg`;
	if (headshotFile) {
		headshotUrl = await uploadHeadshot(headshotFile, id);
	}

	// Generate embedding from user data
	const textForEmbedding = `${firstName} ${lastName} ${bio} ${company}`;
	const embedding = await generateEmbedding(
		textForEmbedding,
		import.meta.env.VITE_OPENAI_API_KEY
	);

	// Save to Supabase
	const { data, error } = await supabase
		.from('documents')
		.insert({
			id: id,
			first_name: firstName,
			last_name: lastName,
			linkedin_url: linkedinUrl,
			bio: bio,
			phone_number: formattedPhone,
			company: company,
			headshot_image: headshotUrl,
			embedding: embedding,
			latitude: 47.6062, // Default Seattle location
			longitude: -122.3321
		})
		.select()
		.single();

	if (error) throw error;

	return data;
}

/**
 * Update existing user profile
 */
export async function updateUserProfile(profileData) {
	const {
		firstName,
		lastName,
		linkedinUrl,
		bio,
		phoneNumber,
		company,
		id,
		headshotFile,
		currentHeadshotUrl
	} = profileData;

	// Format phone number
	const formattedPhone = formatPhoneNumber(phoneNumber);

	// Upload new headshot if provided
	let headshotUrl = currentHeadshotUrl;
	if (headshotFile) {
		headshotUrl = await uploadHeadshot(headshotFile, id);
	}

	// Generate new embedding
	const textForEmbedding = `${firstName} ${lastName} ${bio} ${company}`;
	const embedding = await generateEmbedding(
		textForEmbedding,
		import.meta.env.VITE_OPENAI_API_KEY
	);

	// Update in Supabase
	const { data, error } = await supabase
		.from('documents')
		.update({
			first_name: firstName,
			last_name: lastName,
			linkedin_url: linkedinUrl,
			bio: bio,
			phone_number: formattedPhone,
			company: company,
			headshot_image: headshotUrl,
			embedding: embedding,
			updated_at: new Date().toISOString()
		})
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;

	return data;
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(id) {
	const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();

	if (error) throw error;

	return data; // Will be null if no profile exists
}

/**
 * Check if user has completed profile
 */
export async function hasUserProfile(id) {
	const profile = await getUserProfile(id);
	return !!profile;
}
