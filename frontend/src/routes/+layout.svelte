<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
  	import io from 'socket.io-client';
	// import { localData } from '$lib/data.svelte';
	let { children } = $props();
	let dict = $state({});
	let user = $state({
		name: "SAMPLE USERNAME",
		// No userId - will be assigned by Supabase
		linkedin_url: "https://www.linkedin.com/in/sample-username/",
		bio: "SDE @ Hewlett Packard Enterprise",
		headshot_image: "https://media.licdn.com/dms/image/D4D03AQHjv1eXHk1m7g/profile-displayphoto-shrink_800_800/0/1678887038471?e=1701302400&v=beta&t=ZKJ3nY3c1kC8qfO2nF9lJd8nG4p6Ykz8b9rY3F4g6Uo",
		location: {
			latitude: 47.6062,
			longitude: -122.3321
		}
	});
	// Turn all loaded users' data to a dictionary for easy retrieval
	/*
	{
		"uuid" : {},
		"uuid2" : {}
	}
	*/
	function convertDataToDict(data) {
		data.forEach((user) => {
			dict[user.userId] = user;
		});
	}

	// Initiate socket connections on mount
	onMount(() => {
		console.log('Layout mounted.');
		console.log(user);

		// Link to the Express app server running socketio
		const socket = io('https://6f3ad484c5c1.ngrok-free.app');

		// Join the server room 
		socket.emit("join-room", user);

		// This is how to listen for requests to get this user's location
		socket.on('get-location', () => {
			socket.emit('send-location', user)
		})

		// This is how to listen for the server sending all user locations
		socket.on("update-data", (data) => {
			dict = convertDataToDict(data);
			console.log(JSON.stringify(dict));
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
