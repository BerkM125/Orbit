<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { supabase } from '$lib/supabase.js';

	let firstName = $state('');
	let lastName = $state('');
	let linkedinUrl = $state('');
	let bio = $state('');
	let phoneNumber = $state('');
	let company = $state('');
	let headshotFile = $state(null);
	let headshotUrl = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Generate embedding using OpenAI
	async function generateEmbedding(text) {
		try {
			const response = await fetch('https://api.openai.com/v1/embeddings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
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
		} catch (err) {
			console.error('Error generating embedding:', err);
			throw err;
		}
	}

	// Upload image to Supabase storage
	async function uploadHeadshot(file) {
		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${authStore.user.id}_${Date.now()}.${fileExt}`;

			const { data, error } = await supabase.storage.from('headshots').upload(fileName, file);

			if (error) throw error;

			// Get public URL
			const {
				data: { publicUrl }
			} = supabase.storage.from('headshots').getPublicUrl(fileName);

			return publicUrl;
		} catch (err) {
			console.error('Error uploading headshot:', err);
			throw err;
		}
	}

	// Format phone number to XXX-XXX-XXXX
	function formatPhoneNumber(phone) {
		// Remove all non-numeric characters
		const cleaned = phone.replace(/\D/g, '');

		// Check if it's 10 digits
		if (cleaned.length !== 10) {
			throw new Error('Phone number must be 10 digits');
		}

		// Format as XXX-XXX-XXXX
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
	}

	// Handle form submission
	async function handleSubmit(event) {
		event.preventDefault();
		if (!firstName || !lastName || !linkedinUrl || !bio || !phoneNumber || !company) {
			error = 'Please fill in all required fields';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Format phone number
			let formattedPhone;
			try {
				formattedPhone = formatPhoneNumber(phoneNumber);
			} catch (err) {
				error = 'Please enter a valid 10-digit phone number';
				isLoading = false;
				return;
			}
			// Upload headshot if provided
			let uploadedHeadshotUrl = '';
			if (headshotFile) {
				uploadedHeadshotUrl = await uploadHeadshot(headshotFile);
			}

			// Generate embedding from user data
			const textForEmbedding = `${firstName} ${lastName} ${bio} ${company}`;
			const embedding = await generateEmbedding(textForEmbedding);

			// Save to Supabase documents table
			const { data, error: insertError } = await supabase.from('documents').insert({
				id: authStore.user.id,
				first_name: firstName,
				last_name: lastName,
				linkedin_url: linkedinUrl,
				bio: bio,
				phone_number: formattedPhone,
				company: company,
				headshot_image:
					uploadedHeadshotUrl ||
					`https://www.gravatar.com/avatar/${authStore.user.id}?d=mp&f=y.jpg`,
				embedding: embedding,
				latitude: 47.6062, // Default Seattle location
				longitude: -122.3321
			});

			if (insertError) {
				throw insertError;
			}

			// Redirect to profile or main app
			goto('/profile');
		} catch (err) {
			console.error('Error creating account:', err);
			error = err.message || 'Failed to create account. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle file selection
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				error = 'Please select an image file';
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				error = 'Image must be less than 5MB';
				return;
			}

			headshotFile = file;

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				headshotUrl = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	}

	// Pre-populate with GitHub data if available
	onMount(() => {
		if (authStore.user?.user_metadata) {
			const metadata = authStore.user.user_metadata;
			firstName = metadata.full_name?.split(' ')[0] || '';
			lastName = metadata.full_name?.split(' ').slice(1).join(' ') || '';
			headshotUrl = metadata.avatar_url || '';
		}
	});
</script>

<div class="create-account-container">
	<div class="form-card">
		<h1>Create Your Account</h1>
		<p class="subtitle">Complete your profile to get started</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-row">
				<div class="form-group">
					<label for="firstName">First Name *</label>
					<input
						id="firstName"
						type="text"
						bind:value={firstName}
						required
						disabled={isLoading}
					/>
				</div>
				<div class="form-group">
					<label for="lastName">Last Name *</label>
					<input
						id="lastName"
						type="text"
						bind:value={lastName}
						required
						disabled={isLoading}
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="linkedinUrl">LinkedIn URL *</label>
				<input
					id="linkedinUrl"
					type="url"
					bind:value={linkedinUrl}
					placeholder="https://linkedin.com/in/yourprofile"
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-group">
				<label for="company">Company *</label>
				<input
					id="company"
					type="text"
					bind:value={company}
					placeholder="Your current company"
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-group">
				<label for="phoneNumber">Phone Number *</label>
				<input
					id="phoneNumber"
					type="tel"
					bind:value={phoneNumber}
					placeholder="425-555-0123 or 4255550123"
					required
					disabled={isLoading}
				/>
				<small>Enter 10 digits (area code + number)</small>
			</div>

			<div class="form-group">
				<label for="bio">Bio *</label>
				<textarea
					id="bio"
					bind:value={bio}
					placeholder="Tell us about yourself, your experience, and interests..."
					rows="4"
					maxlength="500"
					required
					disabled={isLoading}
				></textarea>
				<small>{bio.length}/500 characters</small>
			</div>

			<div class="form-group">
				<label for="headshot">Profile Picture</label>
				<div class="file-upload-area">
					{#if headshotUrl}
						<div class="preview-container">
							<img src={headshotUrl} alt="Profile preview" class="headshot-preview" />
							<button
								type="button"
								class="remove-image"
								onclick={() => {
									headshotFile = null;
									headshotUrl = '';
								}}>×</button
							>
						</div>
					{/if}
					<input
						id="headshot"
						type="file"
						accept="image/*"
						onchange={handleFileSelect}
						disabled={isLoading}
						class="file-input"
					/>
					<label for="headshot" class="file-label"> Choose Image </label>
				</div>
			</div>

			<button type="submit" class="submit-btn" disabled={isLoading}>
				{#if isLoading}
					Creating Account...
				{:else}
					Create Account
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.create-account-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--bg-1);
	}

	.form-card {
		background: var(--bg-2);
		padding: 2rem;
		border-radius: 1.5rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		border: 1px solid var(--bg-3);
		width: 100%;
		max-width: 600px;
	}

	h1 {
		text-align: center;
		margin-bottom: 0.5rem;
		color: var(--txt-0);
		font-size: 2rem;
	}

	.subtitle {
		text-align: center;
		color: var(--txt-1);
		margin-bottom: 2rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--txt-1);
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		background: var(--bg-3);
		border: 1px solid var(--bg-3);
		color: var(--txt-0);
		border-radius: 1.5rem;
		font-size: 1rem;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--purple-1);
	}

	input:disabled,
	textarea:disabled {
		background-color: var(--bg-1);
		cursor: not-allowed;
	}

	.file-upload-area {
		position: relative;
	}

	.file-input {
		display: none;
	}

	.file-label {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--bg-3);
		border: 2px dashed var(--bg-3);
		color: var(--txt-1);
		border-radius: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
	}

	.file-label:hover {
		background: var(--bg-1);
		border-color: var(--purple-1);
	}

	.preview-container {
		position: relative;
		margin-bottom: 1rem;
		display: inline-block;
	}

	.headshot-preview {
		width: 100px;
		height: 100px;
		object-fit: cover;
		border-radius: 50%;
		border: 3px solid var(--purple-1);
	}

	.remove-image {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #ff4757;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: var(--purple-1);
		color: var(--bg-1);
		border: none;
		border-radius: 1.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--purple-2);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		background: var(--bg-3);
		color: #ff6b6b;
		padding: 1rem;
		border-radius: 1.5rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(255, 107, 107, 0.3);
	}

	small {
		color: var(--txt-2);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.create-account-container {
			padding: 1rem;
		}

		.form-card {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
