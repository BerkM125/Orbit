<script>
	import { localData } from '$lib/stores/data.svelte.js';
	import { onMount } from 'svelte';
	import { sortUsersByDistance, getHexagonalLayoutData } from '$lib/utils.js';

	$inspect(localData.dict);

	// Touch/drag state
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let gridPosition = $state({ x: 0, y: 0 });
	let lastGridPosition = $state({ x: 0, y: 0 });
	let contentElement;

	// Touch event handlers
	function handleTouchStart(event) {
		isDragging = true;
		const touch = event.touches[0];
		dragStart = { x: touch.clientX, y: touch.clientY };
		lastGridPosition = { ...gridPosition };
		event.preventDefault();
	}

	function handleTouchMove(event) {
		if (!isDragging) return;

		const touch = event.touches[0];
		const deltaX = touch.clientX - dragStart.x;
		const deltaY = touch.clientY - dragStart.y;

		gridPosition = {
			x: lastGridPosition.x + deltaX,
			y: lastGridPosition.y + deltaY
		};

		event.preventDefault();
	}

	function handleTouchEnd(event) {
		isDragging = false;
		event.preventDefault();
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

	onMount(() => {
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
		{#each layoutData.users as user}
			<div
				class="user"
				class:current-user={user.isCurrentUser}
				style="--grid-row: {user.gridPosition.row + 1}; --grid-col: {user.gridPosition.col +
					1}; --stagger: {user.gridPosition.stagger || 0};"
				data-ring={user.ring}
				data-position={user.positionInRing}
			>
				<img
					src={user.profileInfo?.headshot ||
						'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg'}
					alt="{user.first_name} {user.last_name}"
					class="profile-image"
				/>
			</div>
		{/each}
	</div>
</div>

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
		grid-template-rows: repeat(var(--grid-rows), 5rem);
		grid-template-columns: repeat(var(--grid-cols), 5rem);
		gap: 0.15rem 1rem;
		position: relative;
		pointer-events: none;
	}

	.user {
		grid-row: var(--grid-row);
		grid-column: var(--grid-col);
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		cursor: pointer;
		position: relative;
		transform: translateX(calc(var(--stagger) * 6rem));
		pointer-events: auto;
	}

	.user:hover {
		transform: translateX(calc(var(--stagger) * 6rem)) scale(1.1);
		border-color: var(--accent);
		z-index: 10;
	}

	.user.current-user {
		background: var(--bg-3);
		transform: translateX(calc(var(--stagger) * 6rem)) scale(1.2);
	}

	.user.current-user:hover {
		transform: translateX(calc(var(--stagger) * 6rem)) scale(1.3);
	}

	.profile-image {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		object-position: center;
	}
</style>
