const express = require('express');
const cors = require('cors');
const app = express();
const socketIO = require('socket.io');

// Sends locations of all users connected to the app to the other users, so that the bubbles change
function sendLocationUpdates(socketIO) {
}
