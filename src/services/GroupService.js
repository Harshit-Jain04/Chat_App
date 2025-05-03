const { models } = require('../models');
const { Group, User, GroupMember } = models;

class GroupService {
    static async createGroup(name, description, creatorId) {
        const group = await Group.create({
            name,
            description,
            createdBy: creatorId
        });

        // Add creator as a member
        await this.addMemberToGroup(group.id, creatorId);

        return group;
    }

    static async addMemberToGroup(groupId, userId) {
        try {
            // Check if user is already a member
            const existingMember = await GroupMember.findOne({
                where: {
                    groupId: groupId,
                    userId: userId
                }
            });

            if (!existingMember) {
                await GroupMember.create({
                    groupId: groupId,
                    userId: userId
                });
            }

            return await Group.findByPk(groupId);
        } catch (error) {
            console.error('Error adding member to group:', error);
            throw error;
        }
    }

    static async removeMemberFromGroup(groupId, userId) {
        await GroupMember.destroy({
            where: {
                groupId: groupId,
                userId: userId
            }
        });
    }

    static async getUserGroups(userId) {
        try {
            return await Group.findAll({
                include: [{
                    model: GroupMember,
                    where: { userId: userId },
                    attributes: []
                }]
            });
        } catch (error) {
            console.error('Error getting user groups:', error);
            throw error;
        }
    }

    static async getGroupMembers(groupId) {
        try {
            const group = await Group.findByPk(groupId, {
                include: [{
                    model: User,
                    through: GroupMember,
                    as: 'members'
                }]
            });
            return group ? group.members : [];
        } catch (error) {
            console.error('Error getting group members:', error);
            throw error;
        }
    }
}

module.exports = GroupService;
