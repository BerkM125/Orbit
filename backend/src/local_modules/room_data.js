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

module.exports = {
    demoRoom,
    globalUsersProcessed
};