const functions = require('@google-cloud/functions-framework');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Create Express app
const app = express();
app.use(cors());

// Demo room data
const demoRoom = {
    id: 'cascadia',
    name: 'Cascadia Hackathon',
    users: []
};

// Socket.IO setup
let io;
let httpServer;

function initializeSocketIO() {
    if (!httpServer) {
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        io.on("connection", (socket) => {
            console.log("New user connected");
            socket.join(demoRoom.id);

            socket.on("join-room", (data) => {
                const { name, userId } = data;
                demoRoom.users.push({ name, userId, socketId: socket.id });
                socket.to(demoRoom.id).emit("user-joined", { name, userId });
                socket.emit("room-data", demoRoom);
            });

            socket.on("send-message", (data) => {
                socket.to(demoRoom.id).emit("receive-message", data);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
                demoRoom.users = demoRoom.users.filter(user => user.socketId !== socket.id);
                socket.to(demoRoom.id).emit("user-left", { socketId: socket.id });
            });
        });

        // Start Socket.IO server on different port
        const socketPort = process.env.SOCKET_PORT || 8080;
        httpServer.listen(socketPort, () => {
            console.log(`Socket.IO server running on port ${socketPort}`);
        });
    }
}

// Express routes
app.get('/', (req, res) => {
    initializeSocketIO();
    res.json({
        message: 'Socket.IO Chat Server',
        room: demoRoom,
        socketPort: process.env.SOCKET_PORT || 8080,
        endpoints: {
            '/': 'Server info',
            '/room': 'Get room data',
            '/health': 'Health check'
        }
    });
});

app.get('/room', (req, res) => {
    res.json(demoRoom);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        users: demoRoom.users.length 
    });
});

// Register the HTTP function
functions.http('chatServer', app);