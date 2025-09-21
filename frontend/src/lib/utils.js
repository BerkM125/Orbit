/**
 * Calculate the distance between two geographical points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // Earth's radius in kilometers
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
	return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between a user and the current user
 * @param {Object} user - User object with location property
 * @param {Object} currentUser - Current user object with location property
 * @returns {number} Distance in kilometers
 */
export function getDistanceFromCurrentUser(user, currentUser) {
	if (!user.location || !currentUser.location) {
		return Infinity; // Users without location go to the end
	}

	return calculateDistance(
		currentUser.location.latitude,
		currentUser.location.longitude,
		user.location.latitude,
		user.location.longitude
	);
}

/**
 * Sort users by their distance from the current user
 * @param {Object} usersDict - Dictionary of user objects
 * @param {Object} currentUser - Current user object with location
 * @returns {Array} Sorted array of users by distance (closest first)
 */
export function sortUsersByDistance(usersDict, currentUser) {
	const users = Object.values(usersDict);

	return users
		.map((user) => ({
			...user,
			distance: getDistanceFromCurrentUser(user, currentUser)
		}))
		.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate which hexagonal ring a user belongs to based on their position in sorted list
 * Ring 0: current user (center)
 * Ring 1: next 6 users
 * Ring 2: next 12 users
 * Ring 3: next 18 users, etc.
 * @param {number} index - Index in the sorted user list (excluding current user)
 * @returns {number} Ring number
 */
export function getUserRing(index) {
	if (index < 6) return 1;
	if (index < 18) return 2; // 6 + 12
	if (index < 36) return 3; // 6 + 12 + 18

	// General formula: ring n has 6*n users
	let totalUsers = 0;
	let ring = 1;
	while (totalUsers + 6 * ring <= index) {
		totalUsers += 6 * ring;
		ring++;
	}
	return ring;
}

/**
 * Calculate hexagonal grid dimensions needed for a given number of rings
 * @param {number} maxRing - Maximum ring number
 * @returns {Object} Grid dimensions {rows, cols}
 */
export function getHexagonalGridDimensions(maxRing) {
	const rows = maxRing * 2 + 1;
	const cols = maxRing * 2 + 1;
	return { rows, cols };
}

/**
 * Calculate position in hexagonal grid for a user
 * @param {number} ring - Ring number (0 for center)
 * @param {number} positionInRing - Position within that ring (0-based)
 * @param {number} maxRing - Maximum ring number for centering calculations
 * @returns {Object} Position {row, col}
 */
export function getHexagonalPosition(ring, positionInRing, maxRing) {
	const centerRow = maxRing;
	const centerCol = maxRing;

	// Current user at center
	if (ring === 0) {
		return { row: centerRow, col: centerCol };
	}

	// For ring-based positioning, we'll use a hexagonal coordinate system
	// and convert to grid coordinates
	const positions = [];

	// Generate all positions for this ring
	for (let side = 0; side < 6; side++) {
		const sideLength = ring;
		for (let pos = 0; pos < sideLength; pos++) {
			let row, col;

			switch (side) {
				case 0: // Top-left side
					row = centerRow - ring;
					col = centerCol + pos;
					break;
				case 1: // Top-right side
					row = centerRow - ring + pos;
					col = centerCol + ring;
					break;
				case 2: // Right side
					row = centerRow + pos;
					col = centerCol + ring - pos;
					break;
				case 3: // Bottom-right side
					row = centerRow + ring;
					col = centerCol - pos;
					break;
				case 4: // Bottom-left side
					row = centerRow + ring - pos;
					col = centerCol - ring;
					break;
				case 5: // Left side
					row = centerRow - pos;
					col = centerCol - ring + pos;
					break;
			}

			positions.push({ row, col });
		}
	}

	return positions[positionInRing] || { row: centerRow, col: centerCol };
}

/**
 * Create hexagonal layout data for all users
 * @param {Array} sortedUsers - Users sorted by distance (current user should be filtered out)
 * @param {Object} currentUser - Current user object
 * @returns {Object} Layout data with positioned users and grid info
 */
export function getHexagonalLayoutData(sortedUsers, currentUser) {
	// Filter out current user from sorted users
	const otherUsers = sortedUsers.filter((user) => user.id !== currentUser.id);

	// Calculate rings and positions
	const usersWithPositions = [];

	// Add current user at center
	const maxRing = otherUsers.length > 0 ? getUserRing(otherUsers.length - 1) : 0;
	const gridDims = getHexagonalGridDimensions(maxRing);
	const centerRow = maxRing; // Center row index

	const currentUserGridPos = getHexagonalPosition(0, 0, maxRing);
	usersWithPositions.push({
		...currentUser,
		ring: 0,
		positionInRing: 0,
		gridPosition: {
			...currentUserGridPos,
			stagger: 0 // Center row always has 0 stagger
		},
		isCurrentUser: true
	});

	// Add other users
	let currentRingStart = 0;
	otherUsers.forEach((user, index) => {
		const ring = getUserRing(index);

		// Find position within the ring
		let positionInRing = index - currentRingStart;

		// If we've moved to a new ring, update the ring start index
		if (ring > getUserRing(Math.max(0, index - 1))) {
			currentRingStart = index;
			positionInRing = 0;
		}

		// Check if this is the last ring and if it's incomplete
		const isLastRing = ring === maxRing;
		const maxPositionsInRing = 6 * ring;
		const usersInThisRing = otherUsers.filter((_, i) => getUserRing(i) === ring).length;
		const isIncompleteRing = usersInThisRing < maxPositionsInRing;

		// If it's the last incomplete ring, spread users evenly
		if (isLastRing && isIncompleteRing && usersInThisRing > 1) {
			// Calculate evenly spaced positions
			const spacing = maxPositionsInRing / usersInThisRing;
			positionInRing = Math.floor(positionInRing * spacing);
		}

		const gridPos = getHexagonalPosition(ring, positionInRing, maxRing);

		// Calculate stagger based on distance from center row
		const distanceFromCenter = gridPos.row - centerRow;
		let stagger = 0;

		if (distanceFromCenter < 0) {
			// Rows above center: -0.5, -1, -1.5, etc.
			stagger = distanceFromCenter * 0.5;
		} else if (distanceFromCenter > 0) {
			// Rows below center: 0.5, 1, 1.5, etc.
			stagger = distanceFromCenter * 0.5;
		}
		// distanceFromCenter === 0 means it's on the center row, stagger = 0

		usersWithPositions.push({
			...user,
			index,
			ring,
			positionInRing,
			gridPosition: {
				...gridPos,
				stagger
			},
			isCurrentUser: false
		});
	});

	return {
		users: usersWithPositions,
		gridDimensions: gridDims,
		maxRing
	};
}
