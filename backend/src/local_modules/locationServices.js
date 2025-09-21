var { demoRoom, globalUsersProcessed, removeUser, updateUserData } = require('./roomData');

// Process the user location and update global database with local modules
// userData is sent from the client via socket connection
function processUserLocation(userData) {
	console.log('Received client data: ', userData);
	globalUsersProcessed++;
	updateUserData(userData.id, { location: userData.location });

	// Only if all users have been processed can we log the full data
	// GET RID OF THE LENGTH-1 FOR PRODUCTION!!
	if (globalUsersProcessed === demoRoom.users.length - 1) {
		console.log('All users processed: ');
		console.log(demoRoom.users);
		globalUsersProcessed = 0;
	}
}

// Add user to the room given user data provided by client
function addUserToRoom(userData, socketConnection) {
	const { name, id, location, linkedin_url, bio, headshot_url } = userData;
	const userContainer = {
		name: name,
		id: id,
		linkedin_url: linkedin_url,
		bio: bio,
		headshot_image: headshot_url,
		socketId: socketConnection.id,
		location: location
	};

	demoRoom.users.push(userContainer);
}

module.exports = {
	processUserLocation,
	addUserToRoom
};
