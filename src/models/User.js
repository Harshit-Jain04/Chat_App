class User {
    constructor(id, username, socket) {
        this.id = id;
        this.username = username;
        this.socket = socket;
    }

    getUsername() {
        return this.username;
    }

    getId() {
        return this.id;
    }

    getSocket() {
        return this.socket;
    }
}

module.exports = User;
