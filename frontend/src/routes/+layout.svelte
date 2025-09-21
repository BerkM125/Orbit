<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import io from 'socket.io-client';
	import { localData } from '$lib/data.svelte.js';
	let { children } = $props();

	function convertDataToDict(data) {
		const dict = {};
		data.users.forEach((user) => {
			dict[user.userId] = user;
		});
		return dict;
	}

	// Initiate socket connections on mount
	onMount(() => {
		console.log('layout onmount');
		$inspect(localData.user);

		// Connect to socket.io using configurable backend URL
		const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
		const socket = io(backendUrl);

		// Join the server room
		socket.emit('join-room', localData.user);

		// This is how to listen for requests to get this user's location
		socket.on('get-location', () => {
			socket.emit('send-location', localData.user);
		});

		// This is how to listen for the server sending all user locations
		socket.on('update-data', (data) => {
			console.log('update-data', data);
			localData.dict = convertDataToDict(data);
			console.log(JSON.stringify(localData.dict));
		});
	});
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
