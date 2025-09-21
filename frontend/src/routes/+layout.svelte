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
	import { getCurrentLocation } from '$lib/geolocation.js';

	let { children } = $props();
	let socket = $state(null);
	let loading = $state(true);

	// Pages that don't require authentication
	const publicPages = ['/login'];

	// Turn all loaded users' data to a dictionary for easy retrieval
	function convertDataToDict(data) {
		if (!data || !Array.isArray(data)) {
			console.warn('convertDataToDict received invalid data:', data);
			return {};
		}

		let dict = {};
		data.forEach((user) => {
			if (user && user.id) {
				dict[user.id] = user;
			}
		});
		return dict;
	}

	// Initialize socket connection for authenticated users
	async function initializeSocket() {
		if (!authStore.isAuthenticated || socket) return;

		try {
			// Initialize socket connection
			socket = io('https://99f4f29b3cc8.ngrok-free.app');
			console.log('Socket connection initialized');

			// Get fresh geolocation
			const location = await getCurrentLocation();
			console.log('Current location obtained:', location);

			// Join room with minimal data: id and fresh location
			const joinData = {
				id: authStore.user.id,
				location
			};

			socket.emit('join-room', joinData);
			console.log('Emitted join-room with:', joinData);

			// Listen for existing user data update
			socket.on('update-data', (data) => {
				console.log('Received update-data - existing user');
				if (data && data.users) {
					localData.dict = convertDataToDict(data.users);
					localData.user = localData.dict[authStore.user.id] || {};
				} else {
					console.warn('Received update-data but no users array:', data);
					localData.dict = {};
				}
				loading = false; // User exists, data loaded, stop loading
			});

			// Listen for new user requiring profile setup
			socket.on('profile-setup-required', (data) => {
				console.log('Received profile-setup-required - new user needs setup');
				goto('/setup'); // Redirect to setup for profile creation
				loading = false; // Stop loading
			});

			// Listen for requests to get this user's location
			socket.on('get-location', async () => {
				const currentLocation = await getCurrentLocation();
				socket.emit('send-location', {
					id: authStore.user.id,
					location: currentLocation
				});
			});

			// Handle socket connection errors
			socket.on('connect_error', (error) => {
				console.error('Socket connection error:', error);
				loading = false; // Stop loading on error
			});
		} catch (error) {
			console.error('Error initializing socket:', error);
			loading = false; // Stop loading on error
		}
	}

	// Check authentication and redirect if necessary
	$effect(() => {
		if (authStore.loading) return;

		const currentPath = page.url.pathname;
		const isPublicPage = publicPages.includes(currentPath);

		// Handle unauthenticated users
		if (!authStore.isAuthenticated && !isPublicPage) {
			loading = false; // Stop loading for unauthenticated users
			goto('/login');
			return;
		}

		// Handle authenticated users on login page
		if (authStore.isAuthenticated && currentPath === '/login') {
			goto('/');
			return;
		}

		// Allow authenticated users on setup page (they might need to complete setup)
		if (authStore.isAuthenticated && currentPath === '/setup') {
			loading = false; // Stop loading on setup page
			return;
		}

		// Handle unauthenticated users on public pages
		if (!authStore.isAuthenticated && isPublicPage) {
			loading = false; // Stop loading on public pages
			return;
		}

		// Initialize socket for authenticated users
		if (authStore.isAuthenticated) {
			// Keep loading true until socket initialization completes
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
	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Loading...</p>
		</div>
	{:else}
		<main>
			{@render children?.()}
		</main>
	{/if}
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

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 1rem;
	}

	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--bg-2);
		border-top: 3px solid var(--accent);
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

	.loading p {
		margin: 0;
		font-size: 1.1rem;
		color: var(--text-2);
	}
</style>
