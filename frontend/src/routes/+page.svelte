<script>
	import { localData } from '$lib/stores/data.svelte.js';
	import { onMount } from 'svelte';
	import { sortUsersByDistance, getHexagonalLayoutData } from '$lib/utils.js';
	import ProfilePopup from '$lib/ProfilePopup.svelte';

	$inspect(localData.dict);

	// Touch/drag state
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let gridPosition = $state({ x: 0, y: 0 });
	let lastGridPosition = $state({ x: 0, y: 0 });
	let contentElement;
	let selectedProfile = $state(null);
	let showProfilePopup = $state(false);
	let hasMoved = $state(false);

	// Scaling state
	let userElements = $state([]);
	let windowHeight = $state(0);
	let windowWidth = $state(0);

	// Touch event handlers
	function handleTouchStart(event) {
		hasMoved = false;
		const touch = event.touches[0];
		dragStart = { x: touch.clientX, y: touch.clientY };
		lastGridPosition = { ...gridPosition };
		// Don't prevent default here to allow click events
	}

	function handleTouchMove(event) {
		const touch = event.touches[0];
		const deltaX = touch.clientX - dragStart.x;
		const deltaY = touch.clientY - dragStart.y;

		// Check if we've moved enough to consider it a drag
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		if (distance > 10) {
			// 10px threshold
			hasMoved = true;
			isDragging = true;
		}

		if (isDragging) {
			gridPosition = {
				x: lastGridPosition.x + deltaX,
				y: lastGridPosition.y + deltaY
			};
			event.preventDefault();
		}
	}

	function handleTouchEnd(event) {
		isDragging = false;
		// Don't prevent default here to allow click events
	}

	// Mouse event handlers for desktop testing
	function handleMouseDown(event) {
		isDragging = true;
		dragStart = { x: event.clientX, y: event.clientY };
		lastGridPosition = { ...gridPosition };
		event.preventDefault();
	}

	function handleMouseMove(event) {
		if (!isDragging) return;

		const deltaX = event.clientX - dragStart.x;
		const deltaY = event.clientY - dragStart.y;

		gridPosition = {
			x: lastGridPosition.x + deltaX,
			y: lastGridPosition.y + deltaY
		};

		event.preventDefault();
	}

	function handleMouseUp(event) {
		isDragging = false;
		event.preventDefault();
	}

	function handleUserClick(user) {
		if (!hasMoved) {
			selectedProfile = user;
			showProfilePopup = true;
		}
	}

	function closeProfilePopup() {
		showProfilePopup = false;
		selectedProfile = null;
	}

	// Scaling function based on distance from center
	function updateScaling() {
		if (!userElements.length || !windowHeight || !windowWidth) return;

		const centerX = windowWidth / 2;
		const centerY = windowHeight / 2;

		userElements.forEach((element, index) => {
			if (!element) return;

			const rect = element.getBoundingClientRect();
			const elementCenterX = rect.left + rect.width / 2;
			const elementCenterY = rect.top + rect.height / 2;

			// Calculate distance from center (0 to 1, where 1 is at center)
			const distanceY = Math.abs(elementCenterY - centerY) / windowHeight;
			const distanceX = Math.abs(elementCenterX - centerX) / windowWidth;

			// Combine both distances and invert (closer to center = higher scale)
			const scaleY = 1 - distanceY;
			const scaleX = 1 - distanceX;
			const scale = Math.max(0, (scaleY + scaleX) / 2);

			// Apply minimum scale and smooth the effect - make it more pronounced
			const finalScale = Math.max(0.5, scale); // Increased multiplier and higher minimum

			// Check if this is the current user and apply additional scaling
			const isCurrentUser = element.classList.contains('current-user');
			const currentUserScale = isCurrentUser ? 1.1 : 1;
			const totalScale = finalScale * currentUserScale;

			// Get the stagger value from the CSS custom property
			const computedStyle = getComputedStyle(element);
			const stagger = computedStyle.getPropertyValue('--stagger') || '0';
			const staggerValue = parseFloat(stagger) * 7; // Use the circle size for stagger calculation

			element.style.transform = `translateX(${staggerValue}rem) scale(${totalScale})`;
		});
	}
	// let sortedUsersTest = [
	// 	{
	// 		id: 'user-1',
	// 		distance: 1
	// 	},
	// 	{
	// 		id: 'user-2',
	// 		distance: 2
	// 	},
	// 	{
	// 		id: 'user-3',
	// 		distance: 3
	// 	},
	// 	{
	// 		id: 'user-4',
	// 		distance: 4
	// 	},
	// 	{
	// 		id: 'user-5',
	// 		distance: 5
	// 	},
	// 	{
	// 		id: 'user-6',
	// 		distance: 6
	// 	},
	// 	{
	// 		id: 'user-7',
	// 		distance: 7
	// 	},
	// 	{
	// 		id: 'user-8',
	// 		distance: 8
	// 	},
	// 	{
	// 		id: 'user-9',
	// 		distance: 9
	// 	},
	// 	{
	// 		id: 'user-10',
	// 		distance: 10
	// 	},
	// 	{
	// 		id: 'user-11',
	// 		distance: 11
	// 	},
	// 	{
	// 		id: 'user-12',
	// 		distance: 12
	// 	},
	// 	{
	// 		id: 'user-13',
	// 		distance: 13
	// 	},
	// 	{
	// 		id: 'user-14',
	// 		distance: 14
	// 	},
	// 	{
	// 		id: 'user-15',
	// 		distance: 15
	// 	},
	// 	{
	// 		id: 'user-16',
	// 		distance: 16
	// 	},
	// 	{
	// 		id: 'user-17',
	// 		distance: 17
	// 	},
	// 	{
	// 		id: 'user-18',
	// 		distance: 18
	// 	},
	// 	{
	// 		id: 'user-19',
	// 		distance: 19
	// 	},
	// 	{
	// 		id: 'user-20',
	// 		distance: 20
	// 	},
	// 	{
	// 		id: 'user-21',
	// 		distance: 21
	// 	},
	// 	{
	// 		id: 'user-22',
	// 		distance: 22
	// 	},
	// 	{
	// 		id: 'user-23',
	// 		distance: 23
	// 	},
	// 	{
	// 		id: 'user-24',
	// 		distance: 24
	// 	},
	// 	{
	// 		id: 'user-25',
	// 		distance: 25
	// 	},
	// 	{
	// 		id: 'user-26',
	// 		distance: 26
	// 	},
	// 	{
	// 		id: 'user-27',
	// 		distance: 27
	// 	},
	// 	{
	// 		id: 'user-28',
	// 		distance: 28
	// 	}
	// ];
	let sortedUsers = $derived(sortUsersByDistance(localData.dict, localData.user));
	let layoutData = $derived(getHexagonalLayoutData(sortedUsers, localData.user));

	$inspect(sortedUsers);
	$inspect(layoutData);

	// Effect to continuously update scaling
	$effect(() => {
		if (userElements.length > 0) {
			const updateLoop = () => {
				updateScaling();
				requestAnimationFrame(updateLoop);
			};
			updateLoop();
		}
	});

	onMount(() => {
		// Initialize window dimensions
		windowHeight = window.innerHeight;
		windowWidth = window.innerWidth;

		// Update dimensions on resize
		const handleResize = () => {
			windowHeight = window.innerHeight;
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);
		// Add global mouse event listeners for desktop dragging
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		// Add touch event listeners with { passive: false } to allow preventDefault
		if (contentElement) {
			contentElement.addEventListener('touchstart', handleTouchStart, { passive: false });
			contentElement.addEventListener('touchmove', handleTouchMove, { passive: false });
			contentElement.addEventListener('touchend', handleTouchEnd, { passive: false });
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('resize', handleResize);

			if (contentElement) {
				contentElement.removeEventListener('touchstart', handleTouchStart);
				contentElement.removeEventListener('touchmove', handleTouchMove);
				contentElement.removeEventListener('touchend', handleTouchEnd);
			}
		};
	});
</script>

<div
	bind:this={contentElement}
	class="content"
	role="button"
	tabindex="0"
	onmousedown={handleMouseDown}
>
	<div
		class="hexagonal-grid"
		style="--grid-rows: {layoutData.gridDimensions.rows}; --grid-cols: {layoutData
			.gridDimensions.cols}; transform: translate({gridPosition.x}px, {gridPosition.y}px);"
	>
		{#each layoutData.users as user, index}
			<button
				bind:this={userElements[index]}
				class="user"
				class:current-user={user.isCurrentUser}
				style="--grid-row: {user.gridPosition.row + 1}; --grid-col: {user.gridPosition.col +
					1}; --stagger: {user.gridPosition.stagger || 0};"
				data-ring={user.ring}
				data-position={user.positionInRing}
				onclick={() => handleUserClick(user)}
				onkeydown={(e) => e.key === 'Enter' && handleUserClick(user)}
				tabindex="0"
			>
				<img
					src={user.profileInfo?.headshot ||
						'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg'}
					alt="{user.first_name} {user.last_name}"
					class="profile-image"
				/>
			</button>
		{/each}
	</div>
</div>

<!-- Profile Popup -->
<ProfilePopup bind:isOpen={showProfilePopup} bind:profile={selectedProfile} />

<style>
	.content {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		overflow: hidden;
		touch-action: none;
		user-select: none;
	}

	.hexagonal-grid {
		display: grid;
		grid-template-rows: repeat(var(--grid-rows), 6rem);
		grid-template-columns: repeat(var(--grid-cols), 6rem);
		gap: 0.15rem 1rem;
		position: relative;
		pointer-events: none;
	}

	.user {
		grid-row: var(--grid-row);
		grid-column: var(--grid-col);
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		cursor: pointer;
		position: relative;
		transform: translateX(0);
		pointer-events: auto;
		border: 2px solid var(--bg-3);
		padding: 0;
		transition: transform 0.1s ease-out;
	}
	.user.current-user {
		background: var(--bg-3);
		border: 2px solid var(--purple-2);
		box-shadow: 0 0 25px var(--purple-glow);
	}

	.profile-image {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		object-position: center;
	}
</style>
