class Group {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.users = new Map();
        this.messages = [];
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    addUser(user) {
        this.users.set(user.getId(), user);
    }

    removeUser(userId) {
        this.users.delete(userId);
    }

    getUsers() {
        return Array.from(this.users.values());
    }

    addMessage(message) {
        this.messages.push(message);
    }

    getMessages() {
        return this.messages;
    }
}

module.exports = Group;
