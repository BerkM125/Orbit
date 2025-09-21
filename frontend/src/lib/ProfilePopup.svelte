<script>
	let { isOpen = $bindable(false), profile = $bindable(null) } = $props();

	function closePopup() {
		isOpen = false;
		profile = null;
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			closePopup();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closePopup();
		}
	}
</script>

{#if isOpen && profile}
	<div
		class="popup-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="0"
		aria-label="Profile popup"
	>
		<div class="popup-container">
			<button class="close-button" onclick={closePopup}>×</button>

			<div class="profile-content">
				<div class="profile-image-container">
					<img
						src={profile.profileInfo?.headshot ||
							'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg'}
						alt="{profile.first_name} {profile.last_name}"
						class="profile-image"
					/>
				</div>

				<div class="profile-info">
					<h1 class="profile-name">
						{profile.first_name}
						{profile.last_name}
					</h1>

					{#if profile.profileInfo?.bio}
						<p class="profile-bio">{profile.profileInfo.bio}</p>
					{/if}

					{#if profile.profileInfo?.linkedin_url}
						<a
							href={profile.profileInfo.linkedin_url}
							target="_blank"
							rel="noopener noreferrer"
							class="linkedin-link"
						>
							LinkedIn Profile
						</a>
					{/if}

					{#if profile.profileInfo?.company}
						<p class="company">{profile.profileInfo.company}</p>
					{/if}

					{#if profile.profileInfo?.title}
						<p class="title">{profile.profileInfo.title}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.popup-container {
		position: relative;
		background: var(--bg-2);
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		border: 1px solid var(--bg-3);
		overflow: hidden;
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--txt-2);
		cursor: pointer;
		padding: 0.5rem;
		z-index: 10;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		color: var(--txt-0);
		background: var(--bg-3);
	}

	.profile-content {
		padding: 2rem;
		text-align: center;
	}

	.profile-image-container {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.profile-image {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid var(--bg-1);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.profile-info {
		text-align: center;
	}

	.profile-name {
		margin: 0 0 1rem 0;
		color: var(--txt-0);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.profile-bio {
		margin: 0 0 1rem 0;
		color: var(--txt-1);
		line-height: 1.5;
		font-size: 1rem;
	}

	.company {
		margin: 0 0 0.5rem 0;
		color: var(--txt-1);
		font-size: 1rem;
		font-weight: 500;
	}

	.title {
		margin: 0 0 1rem 0;
		color: var(--txt-2);
		font-size: 0.9rem;
	}

	.linkedin-link {
		display: inline-block;
		color: var(--acc-1);
		text-decoration: none;
		font-size: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--acc-1);
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.linkedin-link:hover {
		background: var(--acc-1);
		color: var(--bg-1);
	}
</style>
