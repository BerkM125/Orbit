<script>
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let firstName = $state('');
	let lastName = $state('');
	let profilePicture = $state('');
	let linkedin = $state('');
	let bio = $state('');
	let loading = $state(false);
	let error = $state('');

	// Redirect if not authenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});

	async function handleSubmit() {
		if (!firstName.trim() || !lastName.trim()) {
			error = 'First name and last name are required';
			return;
		}

		loading = true;
		error = '';

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
					linkedin_url: linkedin.trim() || `https://linkedin.com/in/user-${Date.now()}`,
					bio: bio.trim(),
					updated_at: new Date().toISOString()
				})
				.eq('id', authStore.user.id);

			if (updateError) {
				console.error('Error updating profile:', updateError);
				error = 'Failed to update profile. Please try again.';
				return;
			}

			// Redirect to home page after successful profile creation
			goto('/');
		} catch (err) {
			console.error('Error during profile setup:', err);
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="signup-container">
	<div class="signup-card">
		<h1>Complete Your Profile</h1>
		<p>Let's set up your professional profile to help others discover you.</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<div class="form-group">
				<label for="firstName">First Name *</label>
				<input
					id="firstName"
					type="text"
					bind:value={firstName}
					placeholder="Enter your first name"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="lastName">Last Name *</label>
				<input
					id="lastName"
					type="text"
					bind:value={lastName}
					placeholder="Enter your last name"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="profilePicture">Profile Picture URL</label>
				<input
					id="profilePicture"
					type="url"
					bind:value={profilePicture}
					placeholder="https://example.com/your-photo.jpg"
					disabled={loading}
				/>
				<small>Optional: Link to your profile picture (JPG, PNG, etc.)</small>
			</div>

			<div class="form-group">
				<label for="linkedin">LinkedIn Profile</label>
				<input
					id="linkedin"
					type="url"
					bind:value={linkedin}
					placeholder="https://linkedin.com/in/yourname"
					disabled={loading}
				/>
				<small>Optional: Your LinkedIn profile URL</small>
			</div>

			<div class="form-group">
				<label for="bio">Bio</label>
				<textarea
					id="bio"
					bind:value={bio}
					placeholder="Tell others about yourself, your interests, and what you do..."
					rows="4"
					disabled={loading}
				></textarea>
				<small>Optional: A brief description about yourself</small>
			</div>

			<button type="submit" disabled={loading || !firstName.trim() || !lastName.trim()}>
				{#if loading}
					Creating Profile...
				{:else}
					Complete Profile
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.signup-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 1rem;
		background: var(--bg-1);
	}

	.signup-card {
		background: var(--bg-2);
		border-radius: 1rem;
		padding: 2rem;
		width: 100%;
		max-width: 500px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	h1 {
		text-align: center;
		margin: 0 0 0.5rem 0;
		color: var(--txt-1);
		font-size: 1.5rem;
	}

	p {
		text-align: center;
		margin: 0 0 2rem 0;
		color: var(--txt-2);
		font-size: 0.9rem;
	}

	.error-message {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		border: 1px solid #fcc;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-1);
		font-weight: 500;
		font-size: 0.9rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--bg-3);
		border-radius: 0.5rem;
		background: var(--bg-1);
		color: var(--text-1);
		font-size: 1rem;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	input:disabled,
	textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	small {
		display: block;
		margin-top: 0.25rem;
		color: var(--text-2);
		font-size: 0.8rem;
	}

	button {
		width: 100%;
		padding: 0.875rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}
</style>
