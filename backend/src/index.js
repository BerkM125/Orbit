const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
var {
	demoRoom,
	globalUsersProcessed,
	removeUser,
	updateUserData,
	initializeRoomUsers
} = require('./local_modules/roomData');
var { processUserLocation, addUserToRoom } = require('./local_modules/locationServices');
var {
	getAllUserProfiles,
	syncRoomDataToSupabase,
	createOrUpdateUserProfile
} = require('./local_modules/supabaseIntegration');
const { getCallSites } = require('util');

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://uwfnpwmchtnssaejiqep.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Zm5wd21jaHRuc3NhZWppcWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYxNTU4NSwiZXhwIjoyMDczMTkxNTg1fQ.oLxMX8XYEdnEdUZcBw8uNqFShWnkl_4b2zwaow896z0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Express app
const app = express();
app.use(cors());

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the same server
const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	},
	transports: ['websocket', 'polling']
});

// Socket.IO event handlers
io.on('connection', (socket) => {
	console.log('New user connected');
	socket.join(demoRoom.id);

	// Join room command
	socket.on('join-room', async (userData) => {
		try {
			// Create or update the user profile in Supabase and get back the UUID
			const updatedUserData = await createOrUpdateUserProfile(supabase, userData);
			// Add the user to the room with their Supabase UUID
			addUserToRoom(updatedUserData, socket);
			// Send the updated user data (with UUID) back to the client
			socket.emit('update-data', demoRoom);
		} catch (error) {
			console.error('Error processing join request:', error);
			socket.emit('join-error', { message: 'Failed to process join request' });
		}
	});

	// Client will emit this to send data to the server
	socket.on('send-location', (userData) => {
		try {
			console.log('send-location: ', userData);
			processUserLocation(userData);
		} catch (error) {
			console.error('Error processing location:', error);
		}
	});

	// Handle user disconnects
	socket.on('disconnect', () => {
		console.log('Client disconnected');
		removeUser(socket.id);
	});
});

// Express routes
app.get('/', (req, res) => {
	res.json({
		message: 'BubbleUp Backend is running!',
		room: demoRoom
	});
});

// Get JSON for the demo Room
app.get('/room', (req, res) => {
	res.json(demoRoom);
});

// CRITICAL: Listen on the PORT environment variable for Cloud Run
const port = process.env.PORT || 3000;
httpServer.listen(port, async () => {
	console.log(`Server running on port ${port}`);

	// Get and initialize user profiles from Supabase
	try {
		const userProfiles = await getAllUserProfiles(supabase);
		await initializeRoomUsers(userProfiles);
		console.log('Successfully initialized room with Supabase user profiles');
	} catch (error) {
		console.error('Failed to initialize room with Supabase user profiles:', error);
	}
});

// Every 10 seconds, refresh data and sync with Supabase
setInterval(async () => {
	try {
		// First, request latest locations from clients
		io.emit('get-location');

		// Then sync current room data to Supabase
		await syncRoomDataToSupabase(supabase, demoRoom.users);

		// Finally, broadcast updated room data to all clients
		io.emit('update-data', demoRoom);
	} catch (error) {
		console.error('Error during room data refresh:', error);
	}
}, 10000);
