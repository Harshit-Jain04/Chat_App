const User = require('./User');
const Group = require('./Group');
const Message = require('./Message');

class Models {
    constructor() {
        this.users = new Map();
        this.groups = new Map();
        this.messages = new Map();
        this.initializeDefaultGroup();
    }

    initializeDefaultGroup() {
        const generalGroup = new Group('general', 'General');
        this.groups.set(generalGroup.getId(), generalGroup);
    }

    addUser(user) {
        this.users.set(user.getId(), user);
    }

    removeUser(userId) {
        this.users.delete(userId);
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    addGroup(group) {
        this.groups.set(group.getId(), group);
    }

    getGroup(groupId) {
        return this.groups.get(groupId);
    }

    getAllGroups() {
        return Array.from(this.groups.values());
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    addMessage(message) {
        this.messages.set(message.getId(), message);
    }

    getMessage(messageId) {
        return this.messages.get(messageId);
    }

    getAllMessages() {
        return Array.from(this.messages.values());
    }
}

const models = new Models();

module.exports = {
    User,
    Group,
    Message,
    models
};
