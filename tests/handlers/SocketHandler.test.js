const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { SocketHandler } = require('../../src/handlers/SocketHandler');
const { models, sequelize } = require('../../src/models');
const { User, Group, Message } = models;

describe('SocketHandler Test', () => {
    let io, serverSocket, clientSocket, httpServer;
    let socketHandler;
    let testUser;
    let testGroup;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        
        // Create test user and group
        testUser = await User.create({ username: 'testuser' });
        testGroup = await Group.create({
            name: 'Test Group',
            description: 'Test Description',
            createdBy: testUser.id
        });

        // Setup Socket.IO server
        httpServer = createServer();
        io = new Server(httpServer);
        socketHandler = new SocketHandler();
        
        await new Promise((resolve) => {
            httpServer.listen(() => {
                const port = httpServer.address().port;
                clientSocket = new Client(`http://localhost:${port}`);
                io.on('connection', (socket) => {
                    serverSocket = socket;
                    socketHandler.handleConnection(socket, io);
                });
                clientSocket.on('connect', resolve);
            });
        });
    });

    afterAll(async () => {
        await Message.destroy({ where: {} });
        await Group.destroy({ where: {} });
        await User.destroy({ where: {} });
        await sequelize.close();
        io.close();
        clientSocket.close();
        httpServer.close();
    });

    it('should handle user join', (done) => {
        clientSocket.emit('join', { username: 'newuser' });

        clientSocket.on('joined', (data) => {
            expect(data.username).toBe('newuser');
            done();
        });
    });

    it('should handle message sending', (done) => {
        const messageData = {
            content: 'Test message',
            groupId: testGroup.id
        };

        clientSocket.emit('message', messageData);

        clientSocket.on('message', (data) => {
            expect(data.content).toBe(messageData.content);
            expect(data.groupId).toBe(messageData.groupId);
            done();
        });
    });

    it('should handle group creation', (done) => {
        const groupData = {
            name: 'New Test Group',
            description: 'New Test Description'
        };

        clientSocket.emit('createGroup', groupData);

        clientSocket.on('groupCreated', (data) => {
            expect(data.name).toBe(groupData.name);
            expect(data.description).toBe(groupData.description);
            done();
        });
    });
});
