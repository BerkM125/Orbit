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
	socket.join(demoRoom.id);

	// Join room command
	socket.on('join-room', async (userData) => {
		try {
			// Check if user already exists in Supabase by id
			const { data: existingUser, error: fetchError } = await supabase
				.from('documents')
				.select(
					'id, first_name, last_name, linkedin_url, bio, headshot_image, created_at, updated_at, latitude, longitude'
				)
				.eq('id', userData.id)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				// PGRST116 = no rows found
				console.error('Error checking for existing user:', fetchError);
				socket.emit('join-error', { message: 'Database error' });
				return;
			}

			if (existingUser) {
				// Check if user has completed their profile setup (not placeholder values)
				const isProfileComplete =
					existingUser.first_name &&
					existingUser.first_name.trim() &&
					existingUser.first_name !== 'SETUP_REQUIRED' &&
					existingUser.last_name &&
					existingUser.last_name.trim() &&
					existingUser.last_name !== 'SETUP_REQUIRED';

				if (!isProfileComplete) {
					// Emit profile-setup-required event for incomplete profiles
					socket.emit('profile-setup-required', {
						id: userData.id,
						message: 'Profile setup required - incomplete profile'
					});
					return;
				}

				// Update user's location in Supabase
				const { error: updateError } = await supabase
					.from('documents')
					.update({
						latitude: userData.location.latitude,
						longitude: userData.location.longitude,
						updated_at: new Date().toISOString()
					})
					.eq('id', userData.id);

				if (updateError) {
					console.error('Error updating user location:', updateError);
				}

				// Create updated user data for the room
				const updatedUserData = {
					id: existingUser.id,
					first_name: existingUser.first_name,
					last_name: existingUser.last_name,
					location: userData.location, // Use fresh location from client
					profileInfo: {
						linkedIn: existingUser.linkedin_url,
						bio: existingUser.bio,
						headshot: existingUser.headshot_image,
						joinedAt: existingUser.created_at,
						lastActive: new Date().toISOString()
					}
				};

				// Add user to room
				addUserToRoom(updatedUserData, socket);

				// Send room data to client for existing user
				socket.emit('update-data', demoRoom);
			} else {
				// Create minimal profile for new user with placeholder values
				const newUserData = {
					id: userData.id, // Use the auth user id
					first_name: 'SETUP_REQUIRED', // Placeholder that satisfies NOT NULL and check constraints
					last_name: 'SETUP_REQUIRED', // Placeholder that satisfies NOT NULL and check constraints
					linkedin_url: `https://linkedin.com/in/user-${userData.id}`, // Placeholder LinkedIn URL
					bio: '', // Empty string for bio
					headshot_image:
						'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg', // Default headshot
					latitude: userData.location.latitude,
					longitude: userData.location.longitude,
					phone_number: (() => {
						const randomDigits = Math.floor(Math.random() * 10000000)
							.toString()
							.padStart(7, '0');
						return `206-${randomDigits.slice(0, 3)}-${randomDigits.slice(3)}`;
					})(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};

				// Insert new user into Supabase
				const { error: insertError } = await supabase
					.from('documents')
					.insert([newUserData]);

				if (insertError) {
					console.error('Error creating new user profile:', insertError);
					socket.emit('join-error', { message: 'Failed to create user profile' });
					return;
				}

				// Emit profile-setup-required event for new users
				socket.emit('profile-setup-required', {
					id: userData.id,
					message: 'Profile setup required for new user'
				});
			}
		} catch (error) {
			console.error('Error processing join request:', error);
			socket.emit('join-error', { message: 'Failed to process join request' });
		}
	});

	// Handle profile setup completion
	socket.on('profile-setup-complete', async (userData) => {
		try {
			// Fetch the updated user profile from Supabase
			const { data: updatedUser, error: fetchError } = await supabase
				.from('documents')
				.select(
					'id, first_name, last_name, linkedin_url, bio, headshot_image, created_at, updated_at, latitude, longitude'
				)
				.eq('id', userData.id)
				.single();

			if (fetchError || !updatedUser) {
				console.error('Error fetching updated user profile:', fetchError);
				socket.emit('join-error', { message: 'Failed to fetch updated profile' });
				return;
			}

			// Create user data for the room
			const roomUserData = {
				id: updatedUser.id,
				first_name: updatedUser.first_name,
				last_name: updatedUser.last_name,
				location: userData.location, // Use current location
				profileInfo: {
					linkedIn: updatedUser.linkedin_url,
					bio: updatedUser.bio,
					headshot: updatedUser.headshot_image,
					joinedAt: updatedUser.created_at,
					lastActive: new Date().toISOString()
				}
			};

			// Add user to room
			addUserToRoom(roomUserData, socket);

			// Send room data to client
			socket.emit('update-data', demoRoom);
		} catch (error) {
			console.error('Error handling profile setup completion:', error);
		}
	});

	// Client will emit this to send data to the server
	socket.on('send-location', (userData) => {
		try {
			processUserLocation(userData);
		} catch (error) {
			console.error('Error processing location:', error);
		}
	});

	// Handle user disconnects
	socket.on('disconnect', () => {
		removeUser(socket.id);
	});
});

// Express routes
app.get('/', (req, res) => {
	res.json({
		message: 'backend is running!',
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
		console.log(`Server initialized with ${userProfiles.length} user profiles from Supabase`);
	} catch (error) {
		console.error('Failed to initialize room with Supabase user profiles:', error.message);
		console.error('Error details:', error);
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
