<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import MapIcon from '~icons/ph/map-trifold';
	import UserIcon from '~icons/ph/user';
	import HouseIcon from '~icons/ph/house';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import io from 'socket.io-client';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { localData } from '$lib/stores/data.svelte.js';

	let { children } = $props();
	let socket = $state(null);

	// Pages that don't require authentication
	const publicPages = ['/login'];

	// Turn all loaded users' data to a dictionary for easy retrieval
	function convertDataToDict(data) {
		let dict = {};
		data.users.forEach((user) => {
			if (user && user.userId) {
				dict[user.userId] = user;
			}
		});
		return dict;
	}

	// Initialize socket connection for authenticated users
	function initializeSocket() {
		if (!authStore.isAuthenticated || socket) return;

		// Link to the Express app server running socketio
		socket = io('http://localhost:3000');

		// Join the server room with authenticated user data
		const fullName = authStore.user.user_metadata?.full_name || authStore.user.email;
		const nameParts = fullName.split(' ');
		const userData = {
			userId: authStore.user.id,
			first_name: nameParts[0],
			last_name: nameParts.slice(1).join(' ') || 'User',
			email: authStore.user.email,
			avatar_url: authStore.user.user_metadata?.avatar_url,
			location: {
				latitude: 47.6062, // Default location, will be updated with real location
				longitude: -122.3321
			}
		};

		socket.emit('join-room', userData);

		// Listen for requests to get this user's location
		socket.on('get-location', () => {
			socket.emit('send-location', userData);
		});

		// Listen for the server sending all user locations
		socket.on('update-data', (data) => {
			localData.dict = convertDataToDict(data);
		});
	}

	// Check authentication and redirect if necessary
	$effect(() => {
		if (authStore.loading) return;

		const currentPath = page.url.pathname;
		const isPublicPage = publicPages.includes(currentPath);

		if (!authStore.isAuthenticated && !isPublicPage) {
			goto('/login');
			return;
		}

		if (authStore.isAuthenticated && currentPath === '/login') {
			goto('/profile');
			return;
		}

		// Initialize socket for authenticated users
		if (authStore.isAuthenticated) {
			initializeSocket();
		}
	});

	onMount(() => {
		console.log('Layout mounted.');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="container">
	{#if authStore.isAuthenticated}
		<nav>
			<a href="/" class:active={page.url.pathname === '/'}>
				<HouseIcon />
				Home
			</a>
			<a href="/map" class:active={page.url.pathname === '/map'}>
				<MapIcon />
				Map
			</a>
			<a href="/profile" class:active={page.url.pathname === '/profile'}>
				<UserIcon />
				Profile
			</a>
		</nav>
	{/if}
	<main>
		{@render children?.()}
	</main>
</div>

<style>
	nav {
		display: flex;
		position: fixed;
		bottom: 0.5rem;
		left: 0.5rem;
		right: 0.5rem;
		border-radius: 3rem;
		align-items: center;
		padding: 0.5rem;
		z-index: 1000;
		background: var(--bg-2);
		gap: 0.5rem;
	}

	nav a {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
		padding: 0.5rem;
		border-radius: 3rem;
		font-size: 0.75rem;
	}

	nav a :global(.icon) {
		font-size: 1.25rem;
	}

	nav a.active {
		background: var(--bg-3);
	}

	.container {
		flex: 1;
	}
</style>
