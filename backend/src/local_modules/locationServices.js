var { demoRoom, globalUsersProcessed, removeUser, updateUserData } = require('./roomData');

// Process the user location and update global database with local modules
// userData is sent from the client via socket connection
function processUserLocation(userData) {
	globalUsersProcessed++;
	updateUserData(userData.id, { location: userData.location });

	// Reset counter when all users processed
	if (globalUsersProcessed === demoRoom.users.length - 1) {
		globalUsersProcessed = 0;
	}
}

// Add user to the room given user data provided by client
function addUserToRoom(userData, socketConnection) {
	const { first_name, last_name, id, location, profileInfo } = userData;

	// Remove any existing user with the same id to prevent duplicates
	demoRoom.users = demoRoom.users.filter((user) => user.id !== id);

	const userContainer = {
		id: id,
		first_name: first_name,
		last_name: last_name,
		location: location,
		profileInfo: profileInfo,
		socketId: socketConnection.id
	};

	demoRoom.users.push(userContainer);
}

module.exports = {
	processUserLocation,
	addUserToRoom
};
