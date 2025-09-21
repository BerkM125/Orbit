// Demo room data
var globalUsersProcessed = 0;

// This should be replaced by VectorDB and professional data storage mechanism
var demoRoom = {
  id: 'cascadia',
  name: 'Cascadia Hackathon',
  users: [
    {
        name: "Derek",
        userId: "derekNumeric",
        linkedin_url: "https://www.linkedin.com/in/derek-yao/",
        bio: "SWE @ Microsoft",
        headshot_image: "https://media.licdn.com/dms/image/D4D03AQHjv1eXHk1m7g/profile-displayphoto-shrink_800_800/0/1678887038471?e=1701302400&v=beta&t=ZKJ3nY3c1kC8qfO2nF9lJd8nG4p6Ykz8b9rY3F4g6Uo",
        socketId: "socket123",
        location: {
            latitude: 47.61,
            longitude: -122.34
        }
    }
  ]
};

// Remove user function
function removeUser(socketId) {
    for(var i = 0; i < demoRoom.users.length; i++) {
        if(demoRoom.users[i].socketId === socketId) {
            demoRoom.users.splice(i, 1);
            break;
        }
    }
}

// Update specific user's data
function updateUserData(userId, newData) {
    for(var i = 0; i < demoRoom.users.length; i++) {
        if(demoRoom.users[i].userId === userId) {
            demoRoom.users[i] = { ...demoRoom.users[i], ...newData };
            break;
        }
    }
}

// Initialize room with Supabase user profiles
async function initializeRoomUsers(supabaseUsers) {
    // Keep existing users that are connected via socket
    const connectedUsers = demoRoom.users.filter(user => user.socketId);
    
    // Transform and merge Supabase users with connected users
    demoRoom.users = supabaseUsers.map(supabaseUser => {
        // Check if this user is already connected
        const connected = connectedUsers.find(u => u.userId === supabaseUser.userId);
        if (connected) {
            // Merge Supabase profile data with connected user data
            return {
                ...supabaseUser,
                socketId: connected.socketId,
                location: connected.location
            };
        }
        return supabaseUser;
    });
    
    console.log(`Initialized room with ${demoRoom.users.length} users from Supabase`);
    console.log(demoRoom);
}

module.exports = {
    demoRoom,
    globalUsersProcessed,
    removeUser,
    updateUserData,
    initializeRoomUsers
};