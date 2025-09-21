const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
var { demoRoom, globalUsersProcessed } = require('./local_modules/room_data');
// Create Express app
const app = express();
app.use(cors());

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the same server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});
 
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

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("New user connected");
  socket.join(demoRoom.id);
  
  // Join room command
  socket.on("join-room", (data) => {
    const { name, userId, location } = data;
    demoRoom.users.push({
      name,
      userId,
      location,
      socketId: socket.id
    });
  });

  // Client will emit this to send data to the server
  socket.on("send-location", (userData) => {
    console.log("Received client data: ", userData);
    globalUsersProcessed++;
    updateUserData(userData.userId, { location: userData.location });

    // Only if all users have been processed can we log the full data
    // GET RID OF THE LENGTH-1 FOR PRODUCTION!!
    if(globalUsersProcessed === demoRoom.users.length-1) {
        console.log("All users processed: ");
        console.log(demoRoom.users);
        globalUsersProcessed = 0;
    }
  });

  // Handle user disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected");

    // Remove user by socket id
    removeUser(socket.id);
  });

});

// Express routes
app.get('/', (req, res) => {
  res.json({
    message: 'Socket.IO Chat Server',
    room: demoRoom
  });
});

// Get JSON for the demo Room
app.get('/room', (req, res) => {
  res.json(demoRoom);
});

// CRITICAL: Listen on the PORT environment variable for Cloud Run
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Every 5 seconds, send the full json data to all clients
setInterval(() => {
  io.emit("get-location");
  io.emit("update-data", demoRoom);
}, 10000);