// Sends locations of all users connected to the app to the other users, so that the bubbles change
function sendLocationUpdates(socket, roomID) {
    let locationUpdates = [
        {
            "userID": "user1",
            "latitude": 47.6062,
            "longitude": -122.3321
        },
        {
            "userID": "user2",
            "latitude": 47.6097,
            "longitude": -122.3331
        }
    ];
    socket.to(roomID).emit("updateLocation", {"locations": locationUpdates});
}

module.exports = {
    sendLocationUpdates
};
