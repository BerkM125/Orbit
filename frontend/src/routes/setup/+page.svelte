<script>
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getCurrentLocation } from '$lib/geolocation.js';
	import io from 'socket.io-client';

	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data
	let firstName = $state('');
	let lastName = $state('');
	let profilePicture = $state('');
	let linkedin = $state('');
	let bio = $state('');

	async function handleSubmit() {
		loading = true;
		error = '';
		success = '';

		// Validate required fields
		if (!firstName.trim() || !lastName.trim()) {
			error = 'First name and last name are required';
			loading = false;
			return;
		}

		try {
			// Update user profile in Supabase
			const { error: updateError } = await supabase
				.from('documents')
				.update({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					headshot_image:
						profilePicture.trim() ||
						'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg',
					linkedin_url:
						linkedin.trim() || `https://linkedin.com/in/user-${authStore.user.id}`,
					bio: bio.trim(),
					updated_at: new Date().toISOString()
				})
				.eq('id', authStore.user.id);

			if (updateError) {
				throw updateError;
			}

			success = 'Profile updated successfully!';

			// Notify the server that profile setup is complete
			try {
				const socket = io('http://localhost:3000');
				const location = await getCurrentLocation();

				socket.emit('profile-setup-complete', {
					id: authStore.user.id,
					location
				});

				// Listen for the update-data event to know when we can redirect
				socket.on('update-data', () => {
					socket.disconnect();
					goto('/');
				});

				// Fallback redirect after 3 seconds
				setTimeout(() => {
					socket.disconnect();
					goto('/');
				}, 3000);
			} catch (err) {
				console.error('Error notifying server of profile completion:', err);
				// Still redirect even if socket fails
				setTimeout(() => {
					goto('/');
				}, 1500);
			}
		} catch (err) {
			error = err.message || 'Failed to update profile';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Setup Profile - Orbit</title>
</svelte:head>

<div class="setup-container">
	<div class="setup-card">
		<h1>Complete Your Profile</h1>
		<p>Let's set up your profile to connect with professionals in your area.</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="success-message">
				{success}
			</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="firstName">First Name *</label>
				<input
					id="firstName"
					type="text"
					bind:value={firstName}
					required
					disabled={loading}
					placeholder="Enter your first name"
				/>
			</div>

			<div class="form-group">
				<label for="lastName">Last Name *</label>
				<input
					id="lastName"
					type="text"
					bind:value={lastName}
					required
					disabled={loading}
					placeholder="Enter your last name"
				/>
			</div>

			<div class="form-group">
				<label for="profilePicture">Profile Picture URL</label>
				<input
					id="profilePicture"
					type="url"
					bind:value={profilePicture}
					disabled={loading}
					placeholder="https://example.com/your-photo.jpg"
				/>
				<small>Optional: Link to your profile picture</small>
			</div>

			<div class="form-group">
				<label for="linkedin">LinkedIn URL</label>
				<input
					id="linkedin"
					type="url"
					bind:value={linkedin}
					disabled={loading}
					placeholder="https://linkedin.com/in/yourprofile"
				/>
				<small>Optional: Your LinkedIn profile URL</small>
			</div>

			<div class="form-group">
				<label for="bio">Bio</label>
				<textarea
					id="bio"
					bind:value={bio}
					disabled={loading}
					placeholder="Tell others about yourself, your work, and interests..."
					rows="4"
				></textarea>
				<small>Optional: Brief description about yourself</small>
			</div>

			<button type="submit" disabled={loading} class="submit-btn">
				{#if loading}
					<span class="loading-spinner"></span>
					Saving Profile...
				{:else}
					Complete Setup
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.setup-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.setup-card {
		background: white;
		padding: 3rem;
		border-radius: 1rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 500px;
		width: 100%;
	}

	h1 {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: #1f2937;
		text-align: center;
	}

	p {
		color: #6b7280;
		margin-bottom: 2rem;
		line-height: 1.6;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input:disabled,
	textarea:disabled {
		background-color: #f9fafb;
		opacity: 0.6;
		cursor: not-allowed;
	}

	small {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		margin-top: 1rem;
	}

	.submit-btn:hover:not(:disabled) {
		background: #5a67d8;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #ffffff33;
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		border: 1px solid #fecaca;
	}

	.success-message {
		background: #f0fdf4;
		color: #166534;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		border: 1px solid #bbf7d0;
	}
</style>
