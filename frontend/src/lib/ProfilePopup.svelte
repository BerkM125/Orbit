<script>
	import XIcon from '~icons/ph/x';
	import LinkedInIcon from '~icons/ph/linkedin-logo';

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
			<button class="close-button" onclick={closePopup}>
				<XIcon />
			</button>

			<div class="profile-content">
				<div class="profile-header">
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

						{#if profile.profileInfo?.company}
							<p class="company">{profile.profileInfo.company}</p>
						{/if}

						{#if profile.profileInfo?.title}
							<p class="title">{profile.profileInfo.title}</p>
						{/if}
					</div>
				</div>

				{#if profile.profileInfo?.bio}
					<p class="profile-bio">{profile.profileInfo.bio}</p>
				{/if}

				{#if profile.profileInfo?.linkedIn}
					<a
						href={profile.profileInfo.linkedIn}
						target="_blank"
						rel="noopener noreferrer"
						class="linkedin-button"
					>
						<LinkedInIcon />
						LinkedIn
					</a>
				{/if}
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
		border-radius: 1.5rem;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		/* border: 1px solid var(--bg-3);/ */
		overflow: hidden;
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--bg-3);
		border: none;
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

	.close-button :global(svg) {
		font-size: 1.25rem;
	}

	.profile-content {
		padding: 1rem;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.profile-image-container {
		flex-shrink: 0;
	}

	.profile-image {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--bg-3);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.profile-info {
		flex: 1;
		min-width: 0;
	}

	.profile-name {
		margin: 0 0 0.5rem 0;
		color: var(--txt-0);
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.2;
	}

	.profile-bio {
		margin: 0 0 1rem 0;
		color: var(--txt-1);
		line-height: 1.5;
		font-size: 1rem;
	}

	.company {
		margin: 0 0 0.25rem 0;
		color: var(--txt-1);
		font-size: 1rem;
		font-weight: 500;
	}

	.title {
		margin: 0 0 0.5rem 0;
		color: var(--txt-2);
		font-size: 0.9rem;
	}

	.linkedin-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--bg-1);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.75rem;
		background: var(--purple-1);
		border-radius: 1.5rem;
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.5rem;
	}

	.linkedin-button :global(svg) {
		font-size: 1rem;
	}
</style>
