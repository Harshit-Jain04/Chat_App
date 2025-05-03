class ChatService {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    saveMessage(messageData) {
        return this.messageRepository.save(messageData);
    }

    getMessages() {
        return this.messageRepository.getAll();
    }
}

module.exports = { ChatService };
