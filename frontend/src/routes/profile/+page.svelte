<script>
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { supabase } from '$lib/supabase.js';
	import { onMount } from 'svelte';

	let userProfile = $state(null);
	let loading = $state(true);

	async function fetchUserProfile() {
		if (!authStore.user?.id) {
			loading = false;
			return;
		}

		try {
			const { data, error } = await supabase
				.from('documents')
				.select('first_name, last_name, bio, linkedin_url, headshot_image')
				.eq('id', authStore.user.id)
				.single();

			if (error) {
				console.error('Error fetching user profile:', error);
			} else {
				userProfile = data;
			}
		} catch (error) {
			console.error('Failed to fetch user profile:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (authStore.user) {
			fetchUserProfile();
		}
	});

	// Watch for auth changes using $effect
	$effect(() => {
		if (authStore.user && !userProfile) {
			fetchUserProfile();
		}
	});
</script>

<div class="profile-container">
	<div class="profile-header">
		<h1>Profile</h1>
	</div>

	{#if loading}
		<div class="loading-card">
			<div class="loading-spinner"></div>
			<p>Loading profile...</p>
		</div>
	{:else if authStore.user && userProfile}
		<div class="profile-card">
			<div class="profile-avatar">
				<img
					src={userProfile.headshot_image ||
						'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg'}
					alt="Profile"
				/>
			</div>

			<div class="profile-info">
				<h2>{userProfile.first_name} {userProfile.last_name}</h2>
				<p class="email">{authStore.user.email}</p>

				{#if userProfile.bio}
					<div class="bio-section">
						<h3>Bio</h3>
						<p class="bio">{userProfile.bio}</p>
					</div>
				{/if}

				{#if userProfile.linkedin_url}
					<div class="links-section">
						<h3>Links</h3>
						<a
							href={userProfile.linkedin_url}
							target="_blank"
							rel="noopener noreferrer"
							class="linkedin-link"
						>
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a .66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"
								/>
							</svg>
							LinkedIn Profile
						</a>
					</div>
				{/if}
			</div>
		</div>
	{:else if authStore.user}
		<div class="profile-card">
			<div class="empty-state">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
				<h3>Profile not found</h3>
				<p>Please complete your setup to create your profile.</p>
				<a href="/setup" class="setup-link">Complete Profile Setup</a>
			</div>
		</div>
	{/if}

	<div class="profile-actions">
		<button class="logout-btn" onclick={() => authStore.signOut()}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
				<polyline points="16,17 21,12 16,7" />
				<line x1="21" y1="12" x2="9" y2="12" />
			</svg>
			Logout
		</button>
	</div>
</div>

<style>
	.profile-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.profile-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.profile-header h1 {
		margin: 0;
		color: var(--txt-0);
		font-size: 2rem;
		font-weight: 300;
	}

	.logout-btn,
	.setup-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 1.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
		text-decoration: none;
		justify-content: center;
	}

	.logout-btn {
		background: var(--purple-1);
		color: var(--bg-1);
	}

	.logout-btn:hover {
		background: var(--purple-2);
	}

	.setup-link {
		background: transparent;
		color: var(--purple-1);
		border: 2px solid var(--bg-3);
	}

	.setup-link:hover {
		background: var(--purple-1);
		color: var(--bg-1);
	}

	.logout-btn svg {
		width: 16px;
		height: 16px;
	}

	.loading-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem;
		background: var(--bg-2);
		border: 2px solid var(--bg-3);
		border-radius: 1.5rem;
		color: var(--txt-1);
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--bg-3);
		border-top: 3px solid var(--purple-1);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.profile-card {
		background: var(--bg-2);
		border: 2px solid var(--bg-3);
		border-radius: 1.5rem;
		padding: 2rem;
	}

	.profile-avatar {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.profile-avatar img {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--bg-1);
	}

	.profile-info h2 {
		text-align: center;
		margin: 0 0 0.5rem 0;
		color: var(--txt-0);
		font-size: 1.5rem;
		font-weight: 300;
	}

	.email {
		text-align: center;
		color: var(--txt-2);
		margin-bottom: 2rem;
		font-size: 0.875rem;
	}

	.bio-section,
	.links-section {
		margin-top: 2rem;
	}

	.bio-section h3,
	.links-section h3 {
		margin: 0 0 0.75rem 0;
		color: var(--txt-0);
		font-size: 1rem;
		font-weight: 400;
	}

	.bio {
		color: var(--txt-1);
		line-height: 1.6;
		margin: 0;
	}

	.linkedin-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--purple-1);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	.linkedin-link:hover {
		color: var(--purple-2);
	}

	.linkedin-link svg {
		width: 20px;
		height: 20px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		color: var(--txt-2);
	}

	.empty-state svg {
		width: 64px;
		height: 64px;
		margin-bottom: 1rem;
		color: var(--txt-3);
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: var(--txt-1);
		font-size: 1.25rem;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: var(--txt-2);
	}

	.profile-actions {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.profile-container {
			padding: 1rem;
		}

		.profile-avatar img {
			width: 100px;
			height: 100px;
		}
	}
</style>
