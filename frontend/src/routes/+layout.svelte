<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="container">
	<nav>
		<a href="/">Home</a>
		<a href="/map">Map</a>
		<a href="/profile">Profile</a>
	</nav>
	<main>
		{@render children?.()}
	</main>
</div>

<style>
	nav {
		display: flex;
		position: fixed;
		bottom: 0;
		width: 100%;
		justify-content: space-around;
		padding: 1rem;
		z-index: 1000;
	}
</style>
