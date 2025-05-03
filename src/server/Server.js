const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

class Server {
    constructor(socketHandler) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server);
        this.socketHandler = socketHandler;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../../public')));
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../../public/index.html'));
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.socketHandler.handleConnection(socket, this.io);
        });
    }

    start(port) {
        this.server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
}

module.exports = { Server };
