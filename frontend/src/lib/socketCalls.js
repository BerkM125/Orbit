// Connect to the socket server
const socket = io('https://6f3ad484c5c1.ngrok-free.app')

// TO-DO: Replace all of this with whatever variable names you want
// This is an example of the client's "full" database. NOT sent to the server, only received.
let localRoomData = {
    id: 'cascadia',
    name: 'Cascadia Hackathon',
    users: [],
}

// And this is the client's OWN data, that it will SEND to the server.
let userData = {
    name: "Berkan Mertan",
    // No userId - will be assigned by Supabase
    linkedin_url: "https://www.linkedin.com/in/berkan-m/",
    bio: "SDE Intern @ UW",
    headshot_image: "https://media.licdn.com/dms/image/D4D03AQHjv1eXHk1m7g/profile-displayphoto-shrink_800_800/0/1678887038471?e=1701302400&v=beta&t=ZKJ3nY3c1kC8qfO2nF9lJd8nG4p6Ykz8b9rY3F4g6Uo",
    location: {
        latitude: 47.6062,
        longitude: -122.3321
    }
};

// Join the server room 
function joinRoom(userData) {
    socket.emit("join-room", userData);
}

// This is how to listen for requests to get this user's location
socket.on('get-location', () => {
    // TO-DO: Replace 'userData' with the actual user's profile data, a JSON object
    socket.emit('send-location', userData)
})

// This is how to listen for the server sending all user locations
socket.on("update-data", (data) => {
    // TO-DO: Wherever you're storing all the room data on the client side, replace 
    // 'localRoomData' with that variable name
    localRoomData = data;
    alert(JSON.stringify(localRoomData));
});

// TO-DO: Don't touch this.
// Listen for user data updates (including UUID assignment)
socket.on("user-data-updated", (updatedData) => {
    userData = { ...userData, ...updatedData };
    updateUserDataDisplay();
});