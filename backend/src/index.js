const express = require('express');
const cors = require('cors');
const http = require('http'); // Import the http module
const { Server } = require('socket.io'); // Import the Server class

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity in this example
    },
});

// Just a demo room for now
const demoRoom = {
    id: 'cascadia',
    name: 'Cascadia Hackathon',
    users: []
};

// All socket connection logic inside here
io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("join", (data) => {
        const roomID = data.roomID;
        console.log(`Socket ${socket.id} requested to join room: ${roomID}`);
    });
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('Established connection to server home.');
});

// Listen on the shared server instance, not the Express app
server.listen(3000, () => { 
    console.log('Server is running on http://localhost:3000');
});