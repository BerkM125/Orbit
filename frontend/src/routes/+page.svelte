<script>
	import { localData } from '$lib/data.svelte.js';
	import { onMount } from 'svelte';

	let gridElement;
	let items = [];
	let isScrolling = false;

	onMount(() => {
		$inspect(localData.dict);

		// // Get all grid items
		// items = gridElement.querySelectorAll('.grid-item');

		// // Center the grid on the middle item
		// const h = window.innerHeight;
		// const w = window.innerWidth;
		// const c = items[Math.round(items.length / 2)];
		// const cr = c.getBoundingClientRect();

		// window.scroll(cr.left - w / 2 + cr.width / 2, cr.top - h / 2 + cr.height / 2);

		// // Highlight the center item
		// c.classList.add('center');

		// // Start the scroll animation
		// requestAnimationFrame(onScroll);
	});

	function onScroll() {
		if (isScrolling) return;

		const h = window.innerHeight;
		const w = window.innerWidth;
		let pos, s, s2;

		for (let i = 0; i < items.length; i++) {
			pos = items[i].getBoundingClientRect();

			s = (pos.top + pos.height / 2 - h / 2) / h;
			s = 1 - Math.abs(s);
			s = s < 0 ? 0 : s > 1 ? 1 : s;

			s2 = (pos.left + pos.width / 2 - w / 2) / w;
			s2 = 1 - Math.abs(s2);
			s2 = s2 < 0 ? 0 : s2 > 1 ? 1 : s2;

			s = (s + s2) / 2;

			items[i].style.transform = `scale(${s})`;
		}

		requestAnimationFrame(onScroll);
	}
</script>

<svelte:head>
	<title>Orbit - Professional Networking</title>
</svelte:head>

<div class="grid" bind:this={gridElement}>
	{#each localData.dict as user, index}
		<div class="grid-item" data-user-id={user.id}>
			{user.name}
		</div>
	{/each}
</div>

<style>
	/* Honeycomb Grid Styles */
	.grid {
		background: red;
		width: 1000px;
		padding: 250px;
	}

	.grid::after {
		content: '';
		display: block;
		clear: both;
	}

	.grid-item {
		box-sizing: border-box;
		text-align: center;
		padding-top: 100px;
		width: 250px;
		height: 250px;
		overflow: hidden;
		float: left;
		background: #bbb;
		border-radius: 50%;
		margin: 0px;
		margin-top: -35px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		color: #333;
		transition: background-color 0.2s ease;
	}

	.grid-item-buffer {
		opacity: 0;
	}

	.grid-item:nth-child(1),
	.grid-item:nth-child(2),
	.grid-item:nth-child(3),
	.grid-item:nth-child(4),
	.grid-item:nth-child(5),
	.grid-item:nth-child(6) {
		margin-top: 0px;
	}

	.grid-item:nth-child(13n + 8) {
		margin-left: 125px;
		clear: left;
	}

	.grid-item:nth-child(13n + 14) {
		clear: left;
	}

	.grid-item:hover {
		background: #fff;
	}

	.grid-item.center {
		background: #f00;
	}
</style>
