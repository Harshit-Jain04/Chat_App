class ChatUI {
    constructor() {
        // Single socket connection
        this.socket = io();
        this.username = localStorage.getItem('username') || '';
        this.currentGroup = null;
        this.groups = [];
        this.setupDOMElements();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.autoConnect();
        
        // Message formatting and reactions
        this.activeFormats = new Set();
        this.replyingTo = null;
        this.emojiPicker = null;

        // Initialize emoji picker
        window.addEventListener('DOMContentLoaded', () => {
            this.emojiPicker = new EmojiMart.Picker({
                onEmojiSelect: (emoji) => {
                    this.insertEmoji(emoji.native);
                    document.getElementById('emoji-picker').classList.remove('active');
                },
                theme: 'light',
                set: 'native'
            });
            document.getElementById('emoji-picker').appendChild(this.emojiPicker);
        });

        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                btn.classList.toggle('active');
                if (this.activeFormats.has(format)) {
                    this.activeFormats.delete(format);
                } else {
                    this.activeFormats.add(format);
                }
                this.updateInputFormat();
            });
        });

        // Emoji button
        document.getElementById('emoji-btn').addEventListener('click', () => {
            const picker = document.getElementById('emoji-picker');
            picker.classList.toggle('active');
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emoji-picker');
            const emojiBtn = document.getElementById('emoji-btn');
            if (!picker.contains(e.target) && !emojiBtn.contains(e.target)) {
                picker.classList.remove('active');
            }
        });

        // Message input formatting
        this.updateInputFormat = function() {
            const input = document.getElementById('message-input');
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            if (range.collapsed) return;
            
            const fragment = range.extractContents();
            const span = document.createElement('span');
            span.classList.add('formatted');
            this.activeFormats.forEach(format => span.classList.add(format));
            span.appendChild(fragment);
            range.insertNode(span);
            
            // Move cursor to end
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // Insert emoji
        this.insertEmoji = function(emoji) {
            const input = document.getElementById('message-input');
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            const textNode = document.createTextNode(emoji);
            range.insertNode(textNode);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // Message actions
        this.showMessageActions = function(e, messageId) {
            const actionsPopup = document.getElementById('message-actions');
            const rect = e.target.getBoundingClientRect();
            
            actionsPopup.style.top = `${rect.top - actionsPopup.offsetHeight}px`;
            actionsPopup.style.left = `${rect.left}px`;
            actionsPopup.classList.add('active');
            actionsPopup.dataset.messageId = messageId;
        };

        // Handle message reactions
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const messageId = document.getElementById('message-actions').dataset.messageId;
                const emoji = btn.dataset.emoji;
                this.socket.emit('message_reaction', {
                    messageId,
                    emoji,
                    userId: this.socket.id
                });
                document.getElementById('message-actions').classList.remove('active');
            });
        });

        // Handle message actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const messageId = document.getElementById('message-actions').dataset.messageId;
                const action = btn.dataset.action;
                
                switch(action) {
                    case 'reply':
                        this.startReply(messageId);
                        break;
                    case 'copy':
                        this.copyMessage(messageId);
                        break;
                    case 'delete':
                        this.deleteMessage(messageId);
                        break;
                }
                
                document.getElementById('message-actions').classList.remove('active');
            });
        });

        // Reply functionality
        this.startReply = function(messageId) {
            const message = document.querySelector(`[data-message-id="${messageId}"]`);
            const preview = document.getElementById('reply-preview');
            const sender = message.querySelector('.message-sender').textContent;
            const text = message.querySelector('.message-text').textContent;
            
            preview.querySelector('.reply-sender').textContent = sender;
            preview.querySelector('.reply-text').textContent = text;
            preview.classList.add('active');
            this.replyingTo = messageId;
        };

        // Close reply
        document.querySelector('.close-reply').addEventListener('click', () => {
            document.getElementById('reply-preview').classList.remove('active');
            this.replyingTo = null;
        });

        // Copy message
        this.copyMessage = function(messageId) {
            const message = document.querySelector(`[data-message-id="${messageId}"]`);
            const text = message.querySelector('.message-text').textContent;
            navigator.clipboard.writeText(text);
        };

        // Delete message
        this.deleteMessage = function(messageId) {
            this.socket.emit('delete_message', {
                messageId,
                userId: this.socket.id
            });
        };

        // Update message display function
        this.displayMessage = function(message) {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.dataset.messageId = message.id;
            
            const isOwnMessage = message.userId === this.socket.id;
            messageElement.classList.add(isOwnMessage ? 'message-sent' : 'message-received');
            
            // Build message content
            let content = `
                <div class="message-sender">${message.username}</div>
                <div class="message-content">
            `;
            
            // Add reply if present
            if (message.replyTo) {
                const replyMessage = document.querySelector(`[data-message-id="${message.replyTo}"]`);
                if (replyMessage) {
                    const replySender = replyMessage.querySelector('.message-sender').textContent;
                    const replyText = replyMessage.querySelector('.message-text').textContent;
                    content += `
                        <div class="message-reply">
                            <div class="reply-sender">${replySender}</div>
                            <div class="reply-text">${replyText}</div>
                        </div>
                    `;
                }
            }
            
            // Add message text
            content += `<div class="message-text">${message.text}</div>`;
            
            // Add reactions if present
            if (message.reactions && message.reactions.length > 0) {
                content += '<div class="message-reactions">';
                const reactionCounts = {};
                message.reactions.forEach(reaction => {
                    reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
                });
                
                Object.entries(reactionCounts).forEach(([emoji, count]) => {
                    content += `
                        <div class="reaction">
                            <span class="reaction-emoji">${emoji}</span>
                            <span class="reaction-count">${count}</span>
                        </div>
                    `;
                });
                content += '</div>';
            }
            
            content += `
                    <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
                <div class="message-hover-actions">
                    <button class="hover-action-btn" onclick="showMessageActions(event, '${message.id}')">
                        <i class="fas fa-smile"></i>
                    </button>
                </div>
            `;
            
            messageElement.innerHTML = content;
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };

        // Update send message function
        this.sendMessage = function() {
            const input = document.getElementById('message-input');
            const text = input.innerHTML;
            
            if (text.trim() === '') return;
            
            const message = {
                text,
                timestamp: Date.now(),
                username: this.username,
                userId: this.socket.id,
                replyTo: this.replyingTo
            };
            
            this.socket.emit('chat message', message);
            input.innerHTML = '';
            
            // Clear reply preview if present
            document.getElementById('reply-preview').classList.remove('active');
            this.replyingTo = null;
            
            // Clear active formats
            this.activeFormats.clear();
            document.querySelectorAll('.format-btn').forEach(btn => btn.classList.remove('active'));
        };

        // Socket events for reactions and message deletion
        this.socket.on('message_reaction', (data) => {
            const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                // Update reactions display
                let reactionsDiv = messageElement.querySelector('.message-reactions');
                if (!reactionsDiv) {
                    reactionsDiv = document.createElement('div');
                    reactionsDiv.classList.add('message-reactions');
                    messageElement.querySelector('.message-content').appendChild(reactionsDiv);
                }
                
                // Update reaction count
                const reactionElement = reactionsDiv.querySelector(`[data-emoji="${data.emoji}"]`);
                if (reactionElement) {
                    const countElement = reactionElement.querySelector('.reaction-count');
                    countElement.textContent = parseInt(countElement.textContent) + 1;
                } else {
                    const newReaction = document.createElement('div');
                    newReaction.classList.add('reaction');
                    newReaction.dataset.emoji = data.emoji;
                    newReaction.innerHTML = `
                        <span class="reaction-emoji">${data.emoji}</span>
                        <span class="reaction-count">1</span>
                    `;
                    reactionsDiv.appendChild(newReaction);
                }
            }
        });

        this.socket.on('message_deleted', (data) => {
            const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                messageElement.remove();
            }
        });
    }

    setupDOMElements() {
        this.loginScreen = document.getElementById('login-screen');
        this.chatScreen = document.getElementById('chat-screen');
        this.usernameInput = document.getElementById('username-input');
        this.joinBtn = document.getElementById('join-btn');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.querySelector('.send-btn');
        this.messagesContainer = document.getElementById('messages');
        this.groupsList = document.getElementById('groups-list');
        this.createGroupBtn = document.getElementById('create-group-btn');
        this.createGroupModal = document.getElementById('create-group-modal');
        this.groupNameInput = document.getElementById('group-name-input');
        this.confirmGroupBtn = document.getElementById('confirm-group-btn');
        this.cancelGroupBtn = document.getElementById('cancel-group-btn');
        this.currentGroupName = document.getElementById('current-group-name');
        this.availableGroupsList = document.getElementById('available-groups-list');
        this.joinGroupBtn = document.getElementById('join-group-btn');

        if (this.username) {
            this.usernameInput.value = this.username;
        }
    }

    setupEventListeners() {
        this.joinBtn.addEventListener('click', () => this.handleJoin());
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoin();
        });

        // Group management
        this.createGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
        this.confirmGroupBtn.addEventListener('click', () => this.handleCreateGroup());
        this.cancelGroupBtn.addEventListener('click', () => this.hideCreateGroupModal());
        this.groupNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCreateGroup();
        });
        this.joinGroupBtn.addEventListener('click', () => this.loadAvailableGroups());
    }

    setupSocketListeners() {
        // Message events
        this.socket.on('message', (data) => this.handleIncomingMessage(data));
        this.socket.on('messagesLoaded', (data) => this.handleMessagesLoaded(data));

        // User events
        this.socket.on('joinSuccess', (data) => this.handleJoinSuccess(data));
        this.socket.on('userJoined', (data) => this.handleUserJoined(data));
        this.socket.on('userLeft', (data) => this.handleUserLeft(data));

        // Group events
        this.socket.on('groupCreated', (data) => this.handleGroupCreated(data));
        this.socket.on('groupJoined', (data) => this.handleGroupJoined(data));
        this.socket.on('userJoinedGroup', (data) => this.handleUserJoinedGroup(data));
        this.socket.on('newPublicGroup', (data) => this.handleNewPublicGroup(data));
        this.socket.on('availableGroups', (data) => this.handleAvailableGroups(data));
        this.socket.on('error', (data) => this.handleError(data));

        // Connection events
        this.socket.on('disconnect', () => {
            this.addSystemMessage('Disconnected from server. Attempting to reconnect...', 'error');
        });

        this.socket.on('connect', () => {
            if (this.username) {
                this.handleJoin();
            }
        });
    }

    autoConnect() {
        if (this.username) {
            this.handleJoin();
        }
    }

    handleJoin() {
        const username = this.usernameInput.value.trim();
        if (username) {
            this.username = username;
            localStorage.setItem('username', username);
            this.socket.emit('join', { username });
        }
    }

    handleJoinSuccess(data) {
        this.loginScreen.classList.add('hidden');
        this.chatScreen.classList.remove('hidden');
        this.groups = data.groups;
        this.updateGroupList();
        
        if (this.groups.length > 0) {
            this.switchGroup(this.groups[0]);
        }
        
        this.addSystemMessage(`Welcome ${data.user.username}!`);
        
        // Load available groups
        this.loadAvailableGroups();
    }

    handleUserJoined(data) {
        this.addSystemMessage(data.message);
    }

    handleUserLeft(data) {
        this.addSystemMessage(data.message);
    }

    handleIncomingMessage(data) {
        // Only show message if it's for the current group
        if (this.currentGroup && data.groupId === this.currentGroup.id) {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${data.sender === this.username ? 'own' : 'other'}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            if (data.sender !== this.username) {
                const senderElement = document.createElement('div');
                senderElement.className = 'sender';
                senderElement.textContent = data.sender;
                messageContent.appendChild(senderElement);
            }
            
            const contentElement = document.createElement('div');
            contentElement.className = 'content';
            contentElement.textContent = data.content;
            
            const timestampElement = document.createElement('div');
            timestampElement.className = 'timestamp';
            timestampElement.textContent = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            messageContent.appendChild(contentElement);
            messageContent.appendChild(timestampElement);
            messageElement.appendChild(messageContent);
            
            this.messagesContainer.appendChild(messageElement);
            this.scrollToBottom();
        }
    }

    handleMessagesLoaded(messages) {
        this.messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === this.username ? 'own' : 'other'}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            if (msg.sender !== this.username) {
                const senderElement = document.createElement('div');
                senderElement.className = 'sender';
                senderElement.textContent = msg.sender;
                messageContent.appendChild(senderElement);
            }
            
            const contentElement = document.createElement('div');
            contentElement.className = 'content';
            contentElement.textContent = msg.content;
            
            const timestampElement = document.createElement('div');
            timestampElement.className = 'timestamp';
            timestampElement.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            messageContent.appendChild(contentElement);
            messageContent.appendChild(timestampElement);
            messageElement.appendChild(messageContent);
            
            this.messagesContainer.appendChild(messageElement);
        });
        this.scrollToBottom();
    }

    handleCreateGroup() {
        const groupName = this.groupNameInput.value.trim();
        if (groupName) {
            this.socket.emit('createGroup', { 
                name: groupName,
                isPublic: true // You can add a checkbox in modal for private groups
            });
            this.hideCreateGroupModal();
            this.groupNameInput.value = '';
        }
    }

    handleGroupCreated(group) {
        this.groups.push(group);
        this.updateGroupList();
        this.switchGroup(group);
        this.addSystemMessage(`Group "${group.name}" created successfully!`);
    }

    handleGroupJoined(group) {
        this.groups.push(group);
        this.updateGroupList();
        this.switchGroup(group);
        this.addSystemMessage(`You joined "${group.name}"!`);
        this.loadAvailableGroups(); // Refresh available groups
    }

    handleUserJoinedGroup(data) {
        if (this.currentGroup && data.groupId === this.currentGroup.id) {
            this.addSystemMessage(`${data.username} joined the group`);
        }
    }

    handleNewPublicGroup(group) {
        // Only show if we're not already in this group
        if (!this.groups.find(g => g.id === group.id)) {
            this.addSystemMessage(`New group "${group.name}" is available to join!`);
            this.loadAvailableGroups(); // Refresh available groups
        }
    }

    loadAvailableGroups() {
        this.socket.emit('listAvailableGroups');
    }

    handleAvailableGroups(groups) {
        this.availableGroupsList.innerHTML = '';
        
        if (groups.length === 0) {
            const noGroupsMsg = document.createElement('div');
            noGroupsMsg.className = 'no-groups-message';
            noGroupsMsg.textContent = 'No available groups to join';
            this.availableGroupsList.appendChild(noGroupsMsg);
            return;
        }

        groups.forEach(group => {
            // Skip if we're already in this group
            if (this.groups.find(g => g.id === group.id)) {
                return;
            }

            const groupElement = document.createElement('div');
            groupElement.className = 'available-group-item';
            
            const groupInfo = document.createElement('div');
            groupInfo.className = 'group-info';
            
            const groupName = document.createElement('div');
            groupName.className = 'group-name';
            groupName.textContent = group.name;
            
            const groupDetails = document.createElement('div');
            groupDetails.className = 'group-details';
            groupDetails.textContent = `Created by ${group.createdBy}`;
            
            groupInfo.appendChild(groupName);
            groupInfo.appendChild(groupDetails);
            
            const joinButton = document.createElement('button');
            joinButton.className = 'join-group-button';
            joinButton.textContent = 'Join';
            joinButton.addEventListener('click', () => this.joinGroup(group.id));
            
            groupElement.appendChild(groupInfo);
            groupElement.appendChild(joinButton);
            this.availableGroupsList.appendChild(groupElement);
        });
    }

    joinGroup(groupId) {
        this.socket.emit('joinGroup', { groupId });
    }

    handleSendMessage() {
        const content = this.messageInput.value.trim();
        if (content && this.currentGroup) {
            this.socket.emit('message', {
                content,
                groupId: this.currentGroup.id
            });
            this.messageInput.value = '';
        }
    }

    handleError(data) {
        console.error('Error:', data.message);
        this.addSystemMessage(`Error: ${data.message}`, 'error');
    }

    updateGroupList() {
        this.groupsList.innerHTML = '';
        this.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = `group-item ${this.currentGroup && this.currentGroup.id === group.id ? 'active' : ''}`;
            groupElement.textContent = group.name;
            groupElement.addEventListener('click', () => this.switchGroup(group));
            this.groupsList.appendChild(groupElement);
        });
    }

    switchGroup(group) {
        if (this.currentGroup && this.currentGroup.id === group.id) return;
        
        this.currentGroup = group;
        this.currentGroupName.textContent = group.name;
        this.updateGroupList();
        
        // Load messages for the new group
        this.socket.emit('loadMessages', { groupId: group.id });
        this.addSystemMessage(`Switched to ${group.name}`);
    }

    showCreateGroupModal() {
        this.createGroupModal.classList.remove('hidden');
        this.groupNameInput.focus();
    }

    hideCreateGroupModal() {
        this.createGroupModal.classList.add('hidden');
        this.groupNameInput.value = '';
    }

    addSystemMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message system ${type}`;
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat application
new ChatUI();

    btn.addEventListener('click', () => {
        const messageId = document.getElementById('message-actions').dataset.messageId;
        const emoji = btn.dataset.emoji;
        new ChatUI().socket.emit('message_reaction', {
            messageId,
            emoji,
            userId: new ChatUI().socket.id
        });
        document.getElementById('message-actions').classList.remove('active');
    });


// Socket event for reactions
new ChatUI().socket.on('message_reaction', (data) => {
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageElement) {
        let reactionsDiv = messageElement.querySelector('.message-reactions');
        if (!reactionsDiv) {
            reactionsDiv = document.createElement('div');
            reactionsDiv.classList.add('message-reactions');
            messageElement.querySelector('.message-content').appendChild(reactionsDiv);
        }
        
        const existingReaction = reactionsDiv.querySelector(`[data-emoji="${data.emoji}"]`);
        if (existingReaction) {
            const countElement = existingReaction.querySelector('.reaction-count');
            countElement.textContent = parseInt(countElement.textContent) + 1;
        } else {
            const newReaction = document.createElement('div');
            newReaction.classList.add('reaction');
            newReaction.dataset.emoji = data.emoji;
            newReaction.innerHTML = `
                <span class="reaction-emoji">${data.emoji}</span>
                <span class="reaction-count">1</span>
            `;
            reactionsDiv.appendChild(newReaction);
        }
    }
});

// Show message actions
window.showMessageActions = (e, messageId) => {
    const actionsPopup = document.getElementById('message-actions');
    const rect = e.target.getBoundingClientRect();
    
    actionsPopup.style.top = `${rect.top}px`;
    actionsPopup.style.left = `${rect.left}px`;
    actionsPopup.classList.add('active');
    actionsPopup.dataset.messageId = messageId;
};

// Close message actions when clicking outside
document.addEventListener('click', (e) => {
    const actionsPopup = document.getElementById('message-actions');
    if (!actionsPopup.contains(e.target) && !e.target.closest('.hover-action-btn')) {
        actionsPopup.classList.remove('active');
    }
});
