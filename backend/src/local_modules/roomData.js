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

module.exports = {
    demoRoom,
    globalUsersProcessed,
    removeUser,
    updateUserData
};