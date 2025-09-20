const express = require('express');
const cors = require('cors');
const app = express();
const socketIO = require('socket.io')(3000); 

// Just a demo room for now
const demoRoom = {
    id: 'cascadia', // Used to access room info
    name: 'Cascadia Hackathon', // Used to display your current event
    users: []
};

// Someone has connected to the server
socketIO.on("connection", (socket) => {
    console.log("New user connected");

    socketIO.join(demoRoom.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {   
    console.log('Server is running on http://localhost:3000');
    console.log('Press CTRL+C to stop the server');
});