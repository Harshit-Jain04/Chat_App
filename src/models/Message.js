class Message {
    constructor(id, content, sender, timestamp = Date.now()) {
        this.id = id;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    getId() {
        return this.id;
    }

    getContent() {
        return this.content;
    }

    getSender() {
        return this.sender;
    }

    getTimestamp() {
        return this.timestamp;
    }
}

module.exports = Message;
