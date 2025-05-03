const Message = require('../../src/models/Message');
const User = require('../../src/models/User');

describe('Message Model Tests', () => {
    let message;
    let sender;
    const testTimestamp = Date.now();

    beforeEach(() => {
        sender = new User('user123', 'testUser', { id: 'socket123' });
        message = new Message('msg123', 'Hello World', sender, testTimestamp);
    });

    test('should create a new message with correct properties', () => {
        expect(message.getId()).toBe('msg123');
        expect(message.getContent()).toBe('Hello World');
        expect(message.getSender()).toBe(sender);
        expect(message.getTimestamp()).toBe(testTimestamp);
    });

    test('should create a message with current timestamp if not provided', () => {
        const newMessage = new Message('msg456', 'Test content', sender);
        expect(newMessage.getTimestamp()).toBeDefined();
        expect(typeof newMessage.getTimestamp()).toBe('number');
    });

    test('message getters should return correct values', () => {
        expect(message.getId()).toBe('msg123');
        expect(message.getContent()).toBe('Hello World');
        expect(message.getSender().getUsername()).toBe('testUser');
        expect(message.getTimestamp()).toBe(testTimestamp);
    });
});
