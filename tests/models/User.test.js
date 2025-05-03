const User = require('../../src/models/User');

describe('User Model Tests', () => {
    let user;
    const mockSocket = { id: 'socket123' };

    beforeEach(() => {
        user = new User('user123', 'testUser', mockSocket);
    });

    test('should create a new user with correct properties', () => {
        expect(user.getId()).toBe('user123');
        expect(user.getUsername()).toBe('testUser');
        expect(user.getSocket()).toBe(mockSocket);
    });

    test('getUsername should return correct username', () => {
        expect(user.getUsername()).toBe('testUser');
    });

    test('getId should return correct id', () => {
        expect(user.getId()).toBe('user123');
    });

    test('getSocket should return correct socket', () => {
        expect(user.getSocket()).toBe(mockSocket);
    });
});
