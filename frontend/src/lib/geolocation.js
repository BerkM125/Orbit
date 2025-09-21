/**
 * Geolocation utilities for getting user's current position
 */

// Default location (Seattle) as fallback
const DEFAULT_LOCATION = {
	latitude: 47.6062,
	longitude: -122.3321
};

/**
 * Get the user's current geolocation with enhanced error handling
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<{latitude: number, longitude: number}>} User's location or default location
 */
export async function getCurrentLocation(timeout = 10000) {
	return new Promise((resolve) => {
		// Check if geolocation is supported
		if (!navigator.geolocation) {
			console.warn('Geolocation not supported by this browser, using default location');
			resolve(DEFAULT_LOCATION);
			return;
		}

		const options = {
			enableHighAccuracy: true,
			timeout: timeout,
			maximumAge: 60000 // Accept cached location up to 1 minute old
		};

		navigator.geolocation.getCurrentPosition(
			(position) => {
				console.log('Successfully obtained user location');
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				});
			},
			(error) => {
				console.warn('Error getting geolocation:', error.message);
				console.log('Using default location (Seattle)');
				resolve(DEFAULT_LOCATION);
			},
			options
		);
	});
}

/**
 * Request location permission from the user
 * @returns {Promise<string>} Permission state: 'granted', 'denied', or 'prompt'
 */
export async function requestLocationPermission() {
	if (!navigator.permissions) {
		return 'prompt'; // Assume we need to prompt if permissions API not available
	}

	try {
		const permission = await navigator.permissions.query({ name: 'geolocation' });
		return permission.state;
	} catch (error) {
		console.warn('Error checking location permission:', error);
		return 'prompt';
	}
}
