// STANDALONE PROFILE API - NO FRONTEND NEEDED
// Just copy this file anywhere and use it!

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://uwfnpwmchtnssaejiqep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Zm5wd21jaHRuc3NhZWppcWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTU1ODUsImV4cCI6MjA3MzE5MTU4NX0.3Gc3tlFT3FS7K0QAK_Z03RLkteilqj6Mpu9l3Q2vJ4k';

// Your OpenAI API Key - SET THIS IN YOUR ENVIRONMENT
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Format phone number to XXX-XXX-XXXX
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
        throw new Error('Phone number must be 10 digits');
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

// Generate OpenAI embedding
async function generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small"
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate embedding');
    }

    const data = await response.json();
    return data.data[0].embedding;
}

// Upload headshot to Supabase storage
async function uploadHeadshot(file, userId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
        .from('headshots')
        .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('headshots')
        .getPublicUrl(fileName);

    return publicUrl;
}

// ========================================
// MAIN FUNCTION: CREATE USER PROFILE
// ========================================
export async function createUserProfile(profileData) {
    const {
        firstName,
        lastName,
        linkedinUrl,
        bio,
        phoneNumber,
        company,
        userId,
        headshotFile
    } = profileData;

    // Validate required fields
    if (!firstName || !lastName || !linkedinUrl || !bio || !phoneNumber || !company || !userId) {
        throw new Error('All fields are required');
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Upload headshot if provided
    let headshotUrl = `https://www.gravatar.com/avatar/${userId}?d=mp&f=y.jpg`;
    if (headshotFile) {
        headshotUrl = await uploadHeadshot(headshotFile, userId);
    }

    // Generate embedding from user data
    const textForEmbedding = `${firstName} ${lastName} ${bio} ${company}`;
    const embedding = await generateEmbedding(textForEmbedding);

    // Save to Supabase
    const { data, error } = await supabase
        .from('documents')
        .insert({
            id: userId,
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

// ========================================
// USAGE EXAMPLE
// ========================================

// Example usage:
async function example() {
    try {
        const result = await createUserProfile({
            firstName: 'John',
            lastName: 'Doe',
            linkedinUrl: 'https://linkedin.com/in/johndoe',
            bio: 'Software engineer with 5 years experience building scalable web applications.',
            phoneNumber: '4255551234', // Gets formatted to 425-555-1234
            company: 'Tech Corp',
            userId: 'unique-user-id-123',
            headshotFile: null // Optional: File object for image
        });

        console.log('✅ Profile created successfully!');
        console.log('📄 Profile data:', result);
        console.log('🔢 Embedding generated:', result.embedding.length, 'dimensions');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Uncomment to test:
// example();
