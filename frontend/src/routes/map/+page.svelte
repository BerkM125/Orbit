<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { localData } from '$lib/stores/data.svelte.js';

	let map;
	let mapContainer;
	let mapMarkers = {};
	let pageLoaded = false;
	let mapboxgl;
	let searchValue = '';
	let showSearchResults = false;
	let searchResults = [];

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

			// Upon clicking the magnifying glass, search for the people!
			document.getElementsByClassName("chatbot-input-icon")[0].addEventListener("click", async () => {
				await searchForPeople(searchValue);
			});
		} catch (err) {
			console.error('Map initialization error:', err);
		}
	});

	// Function to add new people (for future use) - now handled reactively
	// Note: This would typically be done by updating localData.dict instead

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

	// Update the searchForPeople function
	async function searchForPeople(searchParams) {
		console.log('Searching for:', searchParams);
		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://694e3406fe15.ngrok-free.app ';
			const response = await fetch(`${backendUrl}/search-langflow/${encodeURIComponent(searchParams)}`);
			const results = await response.json();
			searchResults = results;
			showSearchResults = true;
		} catch (error) {
			console.error('Search failed:', error);
		}
	}

	function closeSearchResults() {
		showSearchResults = false;
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

	{#if showSearchResults}
		<div class="modal-backdrop" on:click={closeSearchResults}>
			<div class="search-results-modal" on:click|stopPropagation>
				<div class="modal-header">
					<h2>Search Results</h2>
					<button class="close-button" on:click={closeSearchResults}>×</button>
				</div>
				<div class="results-container">
					{#if !searchResults || searchResults.length === 0}
						<p class="no-results">No results found</p>
					{:else}
						{#each searchResults as result}
							<div class="result-card">
								<img
									src={result.headshot_image}
									alt={`${result.first_name} ${result.last_name}`}
									class="result-avatar"
								/>
								<div class="result-info">
									<h3>{result.first_name} {result.last_name}</h3>
									<p class="bio">{result.bio || 'No bio available'}</p>
									{#if result.linkedin_url}
										<a
											href={result.linkedin_url}
											target="_blank"
											rel="noopener noreferrer"
											class="linkedin-link"
										>
											LinkedIn Profile
										</a>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
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

	/* Modal css styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.search-results-modal {
		background: var(--bg-2);
		border-radius: 8px;
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		border: 1px solid var(--bg-3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--bg-3);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--txt-0);
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--txt-2);
		cursor: pointer;
		padding: 0.5rem;
	}

	.close-button:hover {
		color: var(--txt-0);
	}

	.results-container {
		overflow-y: auto;
		max-height: calc(80vh - 60px);
		padding: 1rem;
	}

	.result-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border-radius: 4px;
		background: var(--bg-1);
		margin-bottom: 1rem;
		border: 1px solid var(--bg-3);
	}

	.result-avatar {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		object-fit: cover;
	}

	.result-info {
		flex: 1;
	}

	.result-info h3 {
		margin: 0 0 0.5rem 0;
		color: var(--txt-0);
		font-size: 1rem;
	}

	.bio {
		margin: 0 0 0.5rem 0;
		color: var(--txt-1);
		font-size: 0.875rem;
	}

	.linkedin-link {
		color: var(--acc-1);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.linkedin-link:hover {
		text-decoration: underline;
	}

	.no-results {
		text-align: center;
		color: var(--txt-2);
		padding: 2rem;
	}
</style>
