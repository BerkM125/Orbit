<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css' rel='stylesheet' />
    <title>CascadiaJS</title>
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let map;
    let mapContainer;
    let mapMarkers = {};
    let pageLoaded = false;
    let mapboxgl;

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

    let allPeople = [
        new People(1, -122.33976551825317, 47.6343886664409, "Ben", "UW SWE")
    ];

    function createMarker(person, color = '#3FB1CE') {
        if (!map || !mapboxgl) {
            console.log('Map or mapboxgl not ready');
            return;
        }
        
        console.log(`Creating marker for ${person.name} at`, person.getCoords());
        
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div>
                    <h3>${person.name}</h3>
                    <p>${person.bio}</p>
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
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: white;
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
            // Dynamic import for client-side only
            const mapboxModule = await import('mapbox-gl');
            mapboxgl = mapboxModule.default; // Assign to component scope variable
            
            const accessToken = import.meta.env.VITE_MAPBOX_API_KEY;
            
            if (!accessToken) {
                console.error('Mapbox API key not found. Please set VITE_MAPBOX_API_KEY in your environment.');
                return;
            }
            
            mapboxgl.accessToken = accessToken;

            console.log('Initializing map...');
            
            map = new mapboxgl.Map({
                container: mapContainer,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-122.308954, 47.608027], // Seattle center
                zoom: 12
            });

            map.on('load', () => {
                console.log('Map loaded, creating markers...');
                pageLoaded = true;
                
                // Create markers for all people
                allPeople.forEach(person => {
                    createMarker(person);
                });
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
                'bottom-right'
            );

            // Add navigation controls
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

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
        allPeople = allPeople.filter(person => person.id !== id);
    }
</script>

<div class="container">
    <div class="map" bind:this={mapContainer}></div>
</div>

<style>
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
</style>