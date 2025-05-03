const Group = require('../../src/models/Group');
const User = require('../../src/models/User');

describe('Group Model Tests', () => {
    let group;
    let user;

    beforeEach(() => {
        group = new Group('group123', 'Test Group');
        user = new User('user123', 'testUser', { id: 'socket123' });
    });

    test('should create a new group with correct properties', () => {
        expect(group.getId()).toBe('group123');
        expect(group.getName()).toBe('Test Group');
        expect(group.getUsers()).toHaveLength(0);
        expect(group.getMessages()).toHaveLength(0);
    });

    test('should add and remove users correctly', () => {
        group.addUser(user);
        expect(group.getUsers()).toHaveLength(1);
        expect(group.getUsers()[0]).toBe(user);

        group.removeUser(user.getId());
        expect(group.getUsers()).toHaveLength(0);
    });

    test('should add messages correctly', () => {
        const message = { id: 'msg1', content: 'Hello', sender: user };
        group.addMessage(message);
        expect(group.getMessages()).toHaveLength(1);
        expect(group.getMessages()[0]).toBe(message);
    });
});
