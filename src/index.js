const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const SocketHandler = require('./handlers/SocketHandler');
const { models } = require('./models');

// Create Express app
const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize socket handler
const socketHandler = new SocketHandler(io);

// Handle socket connections
io.on('connection', (socket) => {
    socketHandler.handleConnection(socket);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
