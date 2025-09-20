const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Use dynamic port from environment
const PORT = process.env.PORT || 3000;

// Configure Socket.IO with fallbacks for Cloud Run
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // Enable polling fallback since WebSockets may not work
  transports: ['websocket', 'polling']
});

const demoRoom = {
    id: 'cascadia',
    name: 'Cascadia Hackathon',
    users: []
};

io.on("connection", (socket) => {
    console.log("New user connected");
    
    // Fix: use socket.join() instead of socketIO.join()
    socket.join(demoRoom.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Use the HTTP server that includes Socket.IO
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});