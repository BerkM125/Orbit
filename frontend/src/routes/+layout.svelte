<script>
    import '../app.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
      import io from 'socket.io-client';
    import { authStore } from '$lib/stores/auth.svelte.js';

    let { children } = $props();
    let dict = $state({});
    let socket = $state(null);

    // Pages that don't require authentication
    const publicPages = ['/login'];

    // Turn all loaded users' data to a dictionary for easy retrieval
    function convertDataToDict(data) {
        if (!data || !data.users) {
            console.warn('Invalid data received:', data);
            return {};
        }
        
        const newDict = {};
        data.users.forEach((user) => {
            if (user && user.userId) {
                newDict[user.userId] = user;
            }
        });
        return newDict;
    }

    // Initialize socket connection for authenticated users
    function initializeSocket() {
        if (!authStore.isAuthenticated || socket) return;

        // Link to the Express app server running socketio
        socket = io('http://localhost:3000');

        // Join the server room with authenticated user data
        const userData = {
            userId: authStore.user.id,
            name: authStore.user.user_metadata?.full_name || authStore.user.email,
            email: authStore.user.email,
            avatar_url: authStore.user.user_metadata?.avatar_url,
            location: {
                latitude: 47.6062, // Default location, will be updated with real location
                longitude: -122.3321
            }
        };

        socket.emit("join-room", userData);

        // Listen for requests to get this user's location
        socket.on('get-location', () => {
            socket.emit('send-location', userData)
        })

        // Listen for the server sending all user locations
        socket.on("update-data", (data) => {
            dict = convertDataToDict(data);
            console.log('Updated user dict:', JSON.stringify(dict));
        });
    }

    // Check authentication and redirect if necessary
    $effect(() => {
        if (authStore.loading) return;

        const currentPath = $page.url.pathname;
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
            <a href="/">Home</a>
            <a href="/map">Map</a>
            <a href="/profile">Profile</a>
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
        bottom: 0;
        width: 100%;
        justify-content: space-around;
        align-items: center;
        padding: 1rem;
        z-index: 1000;
        background: white;
        border-top: 1px solid #e5e7eb;
    }


    main {
        padding-bottom: 6rem; /* Account for fixed navigation */
    }

    .container {
        height: 100%;
    }
</style>
