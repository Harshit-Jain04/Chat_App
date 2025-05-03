const { v4: uuidv4 } = require('uuid');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.users = new Map();
        this.groups = new Map();
        this.userGroups = new Map(); // Map to store which groups a user belongs to
        
        // Create a default "General" group
        const generalGroup = {
            id: 'general',
            name: 'General',
            messages: [],
            createdBy: 'system',
            isPublic: true
        };
        this.groups.set(generalGroup.id, generalGroup);
    }

    handleConnection(socket) {
        console.log('New client connected:', socket.id);

        socket.on('join', (data) => this.handleJoin(socket, data));
        socket.on('message', (data) => this.handleMessage(socket, data));
        socket.on('createGroup', (data) => this.handleCreateGroup(socket, data));
        socket.on('loadMessages', (data) => this.handleLoadMessages(socket, data));
        socket.on('joinGroup', (data) => this.handleJoinGroup(socket, data));
        socket.on('listAvailableGroups', () => this.handleListAvailableGroups(socket));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    handleJoin(socket, data) {
        try {
            const { username } = data;
            if (!username) {
                throw new Error('Username is required');
            }

            // Store user information
            const user = { id: socket.id, username };
            this.users.set(socket.id, user);
            this.userGroups.set(socket.id, new Set(['general'])); // Add user to General group by default

            // Join the General group's socket room
            socket.join('general');

            // Send success response with user's groups
            socket.emit('joinSuccess', {
                user,
                groups: this.getUserGroups(socket.id)
            });

            // Broadcast user joined message to General group
            socket.to('general').emit('userJoined', {
                message: `${username} joined the chat`
            });

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleMessage(socket, data) {
        try {
            const user = this.users.get(socket.id);
            const group = this.groups.get(data.groupId);
            
            if (!user) {
                throw new Error('User not found');
            }
            if (!group) {
                throw new Error('Group not found');
            }
            if (!this.userGroups.get(socket.id).has(data.groupId)) {
                throw new Error('You are not a member of this group');
            }

            const message = {
                id: uuidv4(),
                content: data.content,
                sender: user.username,
                groupId: data.groupId,
                timestamp: new Date()
            };

            // Store message in group
            group.messages.push(message);

            // Broadcast to all users in the group
            this.io.to(data.groupId).emit('message', message);

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleCreateGroup(socket, data) {
        try {
            const user = this.users.get(socket.id);
            if (!user) {
                throw new Error('User not found');
            }

            const groupId = uuidv4();
            const group = {
                id: groupId,
                name: data.name,
                messages: [],
                createdBy: user.username,
                isPublic: data.isPublic ?? true,
                createdAt: new Date()
            };

            this.groups.set(groupId, group);
            
            // Add creator to group
            this.userGroups.get(socket.id).add(groupId);
            socket.join(groupId);

            // Notify creator
            socket.emit('groupCreated', group);

            // Notify all users about new public group
            if (group.isPublic) {
                this.io.emit('newPublicGroup', group);
            }

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleJoinGroup(socket, data) {
        try {
            const user = this.users.get(socket.id);
            const group = this.groups.get(data.groupId);

            if (!user) {
                throw new Error('User not found');
            }
            if (!group) {
                throw new Error('Group not found');
            }
            if (!group.isPublic) {
                throw new Error('This group is private');
            }
            if (this.userGroups.get(socket.id).has(data.groupId)) {
                throw new Error('You are already a member of this group');
            }

            // Add user to group
            this.userGroups.get(socket.id).add(data.groupId);
            socket.join(data.groupId);

            // Notify user
            socket.emit('groupJoined', group);

            // Notify group members
            socket.to(data.groupId).emit('userJoinedGroup', {
                groupId: data.groupId,
                username: user.username
            });

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleListAvailableGroups(socket) {
        try {
            const user = this.users.get(socket.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Get all public groups that user hasn't joined
            const userGroupIds = this.userGroups.get(socket.id);
            const availableGroups = Array.from(this.groups.values())
                .filter(group => group.isPublic && !userGroupIds.has(group.id))
                .map(group => ({
                    id: group.id,
                    name: group.name,
                    createdBy: group.createdBy,
                    createdAt: group.createdAt
                }));

            socket.emit('availableGroups', availableGroups);

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleLoadMessages(socket, data) {
        try {
            const user = this.users.get(socket.id);
            const group = this.groups.get(data.groupId);
            
            if (!user) {
                throw new Error('User not found');
            }
            if (!group) {
                throw new Error('Group not found');
            }
            if (!this.userGroups.get(socket.id).has(data.groupId)) {
                throw new Error('You are not a member of this group');
            }

            socket.emit('messagesLoaded', group.messages);

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleDisconnect(socket) {
        const user = this.users.get(socket.id);
        if (user) {
            // Notify all groups the user was in
            const userGroupIds = this.userGroups.get(socket.id);
            if (userGroupIds) {
                userGroupIds.forEach(groupId => {
                    socket.to(groupId).emit('userLeft', {
                        message: `${user.username} left the chat`
                    });
                });
            }

            // Clean up user data
            this.users.delete(socket.id);
            this.userGroups.delete(socket.id);
        }
    }

    getUserGroups(userId) {
        const userGroupIds = this.userGroups.get(userId);
        return Array.from(userGroupIds)
            .map(groupId => {
                const group = this.groups.get(groupId);
                return {
                    id: group.id,
                    name: group.name,
                    createdBy: group.createdBy,
                    isPublic: group.isPublic
                };
            });
    }
}

module.exports = SocketHandler;
