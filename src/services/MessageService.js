const { models } = require('../models');
const { Message, User } = models;
const { Op } = require('sequelize');

class MessageService {
    async saveMessage(content, senderId, groupId, type = 'text') {
        const message = await Message.create({
            content,
            senderId,
            groupId,
            type
        });

        return await Message.findByPk(message.id, {
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username']
            }]
        });
    }

    async getGroupMessages(groupId, limit = 50, before = new Date()) {
        return await Message.findAll({
            where: {
                groupId,
                createdAt: { [Op.lt]: before }
            },
            order: [['createdAt', 'DESC']],
            limit,
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username']
            }]
        });
    }

    async deleteMessage(messageId, userId) {
        const message = await Message.findByPk(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('Unauthorized to delete this message');
        }
        await message.destroy();
    }
}

module.exports = new MessageService();
