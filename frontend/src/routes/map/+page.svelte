<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { localData } from '$lib/stores/data.svelte.js';

	let map;
	let mapContainer;
	let mapMarkers = {};
	let pageLoaded = false;
	let mapboxgl;
	let searchValue = $state('');

	// Helper function to get coordinates from a person object
	function getCoords(person) {
		return [person.longitude, person.latitude];
	}

	// Convert localData.dict to array format for map markers
	function getPeopleFromLocalData() {
		if (!localData.dict || typeof localData.dict !== 'object') {
			return [];
		}

		return Object.values(localData.dict)
			.filter((user) => user && user.id && user.location)
			.map((user) => {
				const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
				return {
					id: user.id,
					longitude: user.location.longitude,
					latitude: user.location.latitude,
					name: displayName,
					bio: user.profileInfo?.bio || '',
					headshot: user.profileInfo?.headshot
				};
			});
	}

	// Reactive statement to get people data from localData
	let allPeople = $derived(getPeopleFromLocalData());

	// Debug inspection to track data flow
	$inspect({ allPeople, mapReady: !!map && pageLoaded });

	function createMarker(person, color = 'var(--acc-1)') {
		if (!map || !mapboxgl) {
			return;
		}

		// Create custom circular marker element with profile image
		const el = document.createElement('div');
		el.className = 'circular-marker';

		// Add profile image
		const img = document.createElement('img');
		img.className = 'marker-image';
		img.src =
			person.headshot ||
			'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg';
		img.alt = person.name;

		// Handle image load error - fallback to initials
		img.onerror = () => {
			el.innerHTML = '';
			el.classList.add('marker-fallback');
			el.style.backgroundColor = color;
			el.textContent = person.name.charAt(0).toUpperCase();
		};

		el.appendChild(img);

		const marker = new mapboxgl.Marker({ element: el }).setLngLat(getCoords(person)).addTo(map);

		mapMarkers[person.id] = marker;

		el.addEventListener('click', (e) => {
			// Handle marker click
		});
	}

	// Effect to create markers when data is available and map is loaded
	$effect(() => {
		if (map && pageLoaded && allPeople.length > 0) {
			// Clear existing markers
			Object.values(mapMarkers).forEach((marker) => marker.remove());
			mapMarkers = {};

			// Create markers for all people
			allPeople.forEach((person) => {
				createMarker(person);
			});
		}
	});

	onMount(async () => {
		if (!browser) return;

		try {
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
				pageLoaded = true;

				// Force marker creation when map becomes ready
				if (allPeople.length > 0) {
					// Clear existing markers
					Object.values(mapMarkers).forEach((marker) => marker.remove());
					mapMarkers = {};

					// Create markers for all people
					allPeople.forEach((person) => {
						createMarker(person);
					});
				}
			});

			map.on('error', (e) => {
				console.error('Map error:', e);
			});

			// Get user's location and fly to it
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const { latitude, longitude } = position.coords;
						console.log('User location:', latitude, longitude);
						map.flyTo({
							center: [longitude, latitude],
							zoom: 14
						});
					},
					(err) => {
						console.warn('Geolocation error:', err);
					}
				);
			}

			// Add geolocation control
			map.addControl(
				new mapboxgl.GeolocateControl({
					positionOptions: {
						enableHighAccuracy: true
					},
					trackUserLocation: true,
					showUserHeading: true,
					showAccuracyCircle: true
				}),
				'top-right'
			);

			// Add navigation controls
			map.addControl(new mapboxgl.NavigationControl(), 'top-right');
		} catch (err) {
			console.error('Map initialization error:', err);
		}
	});

	// Function to add new people (for future use) - now handled reactively
	// Note: This would typically be done by updating localData.dict instead

	// Function to remove a person's marker - now handled reactively
	// Note: This would typically be done by removing from localData.dict instead
</script>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<div class="container">
	<!-- Search Bar -->
	<div class="search-container">
		<input
			type="text"
			placeholder="Search people..."
			bind:value={searchValue}
			class="search-input"
		/>
	</div>

	<div class="map" bind:this={mapContainer}></div>
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

	.search-container {
		position: absolute;
		top: 20px;
		left: 20px;
		right: 20px;
		z-index: 100;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--bg-3);
		border-radius: 4px;
		background: var(--bg-2);
		color: var(--txt-1);
		font-size: 16px;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.search-input::placeholder {
		color: var(--txt-3);
	}

	.search-input:focus {
		border-color: var(--acc-1);
	}

	@media (max-width: 768px) {
		.search-container {
			top: 16px;
			left: 16px;
			right: 16px;
		}

		.search-input {
			padding: 0.5rem 0.75rem;
			font-size: 16px; /* Prevents zoom on iOS */
		}
	}

	/* Mapbox marker styles */

	:global(.circular-marker) {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: 2px solid var(--bg-1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		overflow: hidden;
		background-color: var(--bg-2);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	:global(.circular-marker:hover) {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	:global(.marker-image) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	:global(.marker-fallback) {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: bold;
		color: var(--txt-0);
	}
</style>
