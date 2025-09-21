<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let map;
	let mapContainer;
	let mapMarkers = {};
	let pageLoaded = false;
	let mapboxgl;
	let searchValue = '';

	class People {
		constructor(id, longitude, latitude, name, bio) {
			this.id = id;
			this.longitude = longitude;
			this.latitude = latitude;
			this.name = name;
			this.bio = bio;
		}

		getCoords() {
			return [this.longitude, this.latitude];
		}
	}

	let allPeople = [];

	// Fetch people data from backend
	async function fetchPeopleData() {
		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
			const response = await fetch(`${backendUrl}/room`);
			const data = await response.json();

			// Create People objects from Supabase data
			const people = data.users.map((user, index) => {
				const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
				return new People(
					user.id, // Use id as id
					user.location.longitude,
					user.location.latitude,
					displayName,
					user.profileInfo.bio || 'Professional'
				);
			});

			allPeople = people;
			console.log('Loaded people from backend:', allPeople);
		} catch (error) {
			console.error('Error fetching people data:', error);
			// Fallback to hardcoded data if backend fails
			allPeople = [
				new People(1, -122.33976551825317, 47.6343886664409, 'Ben', 'UW SWE'),
				new People(2, -122.30495300951455, 47.653137379218705, 'Yifan', 'UW SWE')
			];
		}
	}

	function createMarker(person, color = 'var(--acc-1)') {
		if (!map || !mapboxgl) {
			console.log('Map or mapboxgl not ready');
			return;
		}

		console.log(`Creating marker for ${person.name} at`, person.getCoords());

		const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="background: var(--bg-2); color: var(--txt-0); padding: 0.75rem; border-radius: 4px; border: 1px solid var(--bg-3);">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 300;">${person.name}</h3>
                    <p style="margin: 0; color: var(--txt-1); font-size: 0.875rem;">${person.bio}</p>
                </div>
            `);

		// Create custom circular marker element
		const el = document.createElement('div');
		el.className = 'circular-marker';
		el.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: ${color};
            border: 3px solid var(--bg-1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: var(--bg-1);
            font-family: 'DM Mono', monospace;
        `;

		// Add initials or icon to the marker (optional)
		el.textContent = person.name.charAt(0).toUpperCase();

		const marker = new mapboxgl.Marker({ element: el })
			.setLngLat(person.getCoords())
			.setPopup(popup)
			.addTo(map);

		mapMarkers[person.id] = marker;

		el.addEventListener('click', (e) => {
			console.log('Clicked on', person.name);
		});
	}


	onMount(async () => {
		if (!browser) return;

		try {
			// Fetch people data first
			await fetchPeopleData();

			// Dynamic import for client-side only
			const mapboxModule = await import('mapbox-gl');
			mapboxgl = mapboxModule.default; // Assign to component scope variable

			const accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

			if (!accessToken) {
				console.error(
					'Mapbox API key not found. Please set VITE_MAPBOX_API_KEY in your environment.'
				);
				return;
			}

			mapboxgl.accessToken = accessToken;

			console.log('Initializing map...');

			map = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [-122.308954, 47.608027],
				zoom: 12
			});

			map.on('load', () => {
				console.log('Map loaded, creating markers...');
				pageLoaded = true;

				// Create markers for all people
				allPeople.forEach((person) => {
					createMarker(person);
				});
			});

			map.on('error', (e) => {
				console.error('Map error:', e);
			});

			// Add geolocation control that shows native blue dot
			const geolocateControl = new mapboxgl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true,
				showUserHeading: true,
				showAccuracyCircle: true
			});

			map.addControl(geolocateControl, 'top-right');

			// Automatically trigger geolocation on page load
			map.on('load', () => {
				geolocateControl.trigger();
			});

			// Add navigation controls
			map.addControl(new mapboxgl.NavigationControl(), 'top-right');

			// Function to search for people using langflow powered search
			async function searchForPeople(searchParams) {
				console.log('Searching for:', searchParams);
				// await an http request to https://6f3ad484c5c1.ngrok-free.app/search/[searchParams]
				const response = await fetch(`https://6f3ad484c5c1.ngrok-free.app/search/${encodeURIComponent(searchParams)}`);
				const results = await response.json();
				alert("RESULTS IN CONSOLE!");
				console.log("RESULTS: ", results);
			}

			// Upon clicking the magnifying glass, search for the people!
			document.getElementsByClassName("chatbot-input-icon")[0].addEventListener("click", async () => {
				await searchForPeople(searchValue);
			});
		} catch (err) {
			console.error('Map initialization error:', err);
		}
	});

	// Function to add new people (for future use)
	function addPerson(id, longitude, latitude, name, bio) {
		const newPerson = new People(id, longitude, latitude, name, bio);
		allPeople = [...allPeople, newPerson];

		if (map && pageLoaded && mapboxgl) {
			createMarker(newPerson);
		}
	}

	// Function to remove a person's marker
	function removePerson(id) {
		if (mapMarkers[id]) {
			mapMarkers[id].remove();
			delete mapMarkers[id];
		}
		allPeople = allPeople.filter((person) => person.id !== id);
	}
</script>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<div class="container">
	<div class="map" bind:this={mapContainer}></div>

	<!-- Chatbot Bar -->
	<div class="chatbot-input-container">
		<div class="chatbot-input">
			<svg
				class="chatbot-input-icon icon"
				id="searchSVG"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8"></circle>
				<path d="m21 21-4.35-4.35"></path>
			</svg>
			<input
				type="text"
				placeholder="Search for people..."
				bind:value={searchValue}
				class="search-input"
			/>
		</div>
	</div>
</div>

<style>
	/* === LAYOUT === */
	.container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map {
		position: absolute;
		width: 100vw;
		height: 100vh;
	}

	.chatbot-input-container {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		width: 100%;
		max-width: calc(100vw - 40px); /* Prevent overflow with 20px margin on each side */
		padding: 0 20px;
		box-sizing: border-box;
		pointer-events: none;
	}

	.chatbot-input {
		display: flex;
		align-items: center;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		padding: 0.75rem 1rem;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		pointer-events: auto;
		transition: all 0.2s ease;
		font-family: 'DM Mono', monospace;
	}

	.chatbot-input:hover {
		background: var(--bg-3);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
		transform: translateY(-1px);
	}

	.chatbot-input:focus-within {
		border-color: var(--acc-1);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			0 0 0 2px rgba(var(--acc-1), 0.2);
		transform: translateY(-1px);
	}

	.chatbot-input-icon {
		width: 20px;
		height: 20px;
		color: var(--txt-2);
		margin-right: 0.75rem;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 16px;
		background: transparent;
		color: var(--txt-1);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--txt-3);
	}

		@media (max-width: 768px) {
		.chatbot-input-container {
			top: 16px;
			padding: 0 16px;
			max-width: calc(100vw - 32px);
		}		.chatbot-input {
			padding: 0.5rem 0.75rem;
		}

		.chatbot-input-icon {
			width: 18px;
			height: 18px;
			margin-right: 0.5rem;
		}

		.search-input {
			font-size: 16px; /* Prevents zoom on iOS */
		}

		.search-input::placeholder {
			font-size: 14px;
		}
	}

	/* Focus styles for keyboard navigation */
	.search-input:focus {
		outline: none;
	}

	/* Touch target optimization for mobile */
	@media (hover: none) and (pointer: coarse) {
		.chatbot-input {
			min-height: 48px; /* Ensures touch target is at least 48px */
		}
	}

</style>
