<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import io from 'socket.io-client';
	import { data } from '$lib/data.svelte';
	let { children } = $props();

	function convertDataToDict(data) {
		data.forEach((user) => {
			data.dict[user.userId] = user;
		});
	}

	// Initiate socket connections on mount
	onMount(() => {
		console.log('layout onmount');
		console.log(data.user);

		// Connect to socket.io using configurable backend URL
		const socket = io('http://localhost:3000');

		// Join the server room
		socket.emit('join-room', data.user);

		// This is how to listen for requests to get this user's location
		socket.on('get-location', () => {
			socket.emit('send-location', data.user);
		});

		// This is how to listen for the server sending all user locations
		socket.on('update-data', (data) => {
			data.dict = convertDataToDict(data);
			console.log(JSON.stringify(data.dict));
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
