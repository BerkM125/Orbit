const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
var { demoRoom, globalUsersProcessed, removeUser, updateUserData } = require('./local_modules/roomData');
var { processUserLocation, addUserToRoom } = require('./local_modules/locationServices');

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

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("New user connected");
  socket.join(demoRoom.id);
  
  // Join room command
  socket.on("join-room", (userData) => {
    addUserToRoom(userData, socket);
  });

  // Client will emit this to send data to the server
  socket.on("send-location", (userData) => {
    processUserLocation(userData);
  });

  // Handle user disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected");
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
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Every 5 seconds, send the full json data to all clients
setInterval(() => {
  io.emit("get-location");
  io.emit("update-data", demoRoom);
}, 10000);