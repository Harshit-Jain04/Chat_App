class MessageRepository {
    constructor() {
        this.messages = [];
    }

    save(message) {
        this.messages.push(message);
        return message;
    }

    getAll() {
        return this.messages;
    }
}

module.exports = { MessageRepository };
