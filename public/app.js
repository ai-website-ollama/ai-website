// Ollama AI Chat - Frontend JavaScript

class OllamaChatApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('mainContent');
        this.chatList = document.getElementById('chatList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHeader = document.getElementById('chatHeader');
        this.modelSelect = document.getElementById('modelSelect');
        this.newChatModel = document.getElementById('newChatModel');
        this.modelName = document.getElementById('modelName');
        this.deleteChatBtn = document.getElementById('deleteChatBtn');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.ollamaUrl = document.getElementById('ollamaUrl');
        
        this.userInfo = document.getElementById('userInfo');
        this.userInitial = document.getElementById('userInitial');
        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        this.loginModal = document.getElementById('loginModal');
        this.registerModal = document.getElementById('registerModal');
        this.newChatModal = document.getElementById('newChatModal');
        this.confirmModal = document.getElementById('confirmModal');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.closeLoginModal = document.getElementById('closeLoginModal');
        this.closeRegisterModal = document.getElementById('closeRegisterModal');
        this.closeNewChatModal = document.getElementById('closeNewChatModal');
        this.closeConfirmModal = document.getElementById('closeConfirmModal');
        
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.newChatForm = document.getElementById('newChatForm');
        
        this.showRegisterFromLogin = document.getElementById('showRegisterFromLogin');
        this.showLoginFromRegister = document.getElementById('showLoginFromRegister');
        
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.cancelConfirm = document.getElementById('cancelConfirm');
        this.confirmAction = document.getElementById('confirmAction');
        
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        
        this.currentChatId = null;
        this.currentModel = 'llama3';
        this.models = [];
        this.user = null;
        this.isSending = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadModels();
        this.checkSession();
        this.updateUI();
        
        this.ollamaUrl.textContent = window.location.origin.includes('192.168.10.181') 
            ? 'http://192.168.10.181:11434' 
            : 'http://192.168.10.181:11434';
    }
    
    setupEventListeners() {
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.newChatBtn.addEventListener('click', () => this.showNewChatModal());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        this.loginBtn.addEventListener('click', () => this.showLoginModal());
        this.registerBtn.addEventListener('click', () => this.showRegisterModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        this.closeLoginModal.addEventListener('click', () => this.closeLoginModal());
        this.closeRegisterModal.addEventListener('click', () => this.closeRegisterModal());
        this.closeNewChatModal.addEventListener('click', () => this.closeNewChatModal());
        this.closeConfirmModal.addEventListener('click', () => this.closeConfirmModal());
        
        [this.loginModal, this.registerModal, this.newChatModal, this.confirmModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
        
        this.showRegisterFromLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeLoginModal();
            this.showRegisterModal();
        });
        
        this.showLoginFromRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeRegisterModal();
            this.showLoginModal();
        });
        
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.newChatForm.addEventListener('submit', (e) => this.handleNewChat(e));
        
        this.deleteChatBtn.addEventListener('click', () => this.confirmDeleteChat());
        
        this.cancelConfirm.addEventListener('click', () => this.closeConfirmModal());
        this.confirmAction.addEventListener('click', () => this.executeConfirmAction());
        
        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.modelName.textContent = this.currentModel;
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    async checkSession() {
        try {
            const response = await fetch('/api/session');
            const data = await response.json();
            
            if (data.user) {
                this.user = data.user;
                this.updateUserInfo();
                this.loadChats();
            } else {
                this.user = null;
                this.updateUserInfo();
            }
            
            this.updateUI();
        } catch (error) {
            console.error('Session check error:', error);
        }
    }
    
    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            
            this.models = data.models || ['llama3', 'llama3.2', 'mistral', 'phi3'];
            this.updateModelSelect(this.modelSelect, this.currentModel);
            this.updateModelSelect(this.newChatModel, this.currentModel);
            
            if (this.models.length > 0) {
                this.currentModel = this.models[0];
                this.modelName.textContent = this.currentModel;
            }
        } catch (error) {
            console.error('Load models error:', error);
            this.models = ['llama3', 'llama3.2', 'mistral', 'phi3'];
            this.updateModelSelect(this.modelSelect, this.currentModel);
            this.updateModelSelect(this.newChatModel, this.currentModel);
        }
    }
    
    updateModelSelect(selectElement, selectedValue) {
        selectElement.innerHTML = '';
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === selectedValue) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
        
        if (!this.models.includes('llama3')) {
            const option = document.createElement('option');
            option.value = 'llama3';
            option.textContent = 'llama3';
            selectElement.appendChild(option);
        }
    }
    
    updateUserInfo() {
        if (this.user) {
            this.userInitial.textContent = this.user.username.charAt(0).toUpperCase();
            this.userName.textContent = this.user.username;
            this.userEmail.textContent = this.user.email;
        } else {
            this.userInitial.textContent = '?';
            this.userName.textContent = 'Guest';
            this.userEmail.textContent = '';
        }
    }
    
    updateUI() {
        const isAuthenticated = this.user !== null;
        this.loginBtn.style.display = isAuthenticated ? 'none' : 'block';
        this.registerBtn.style.display = isAuthenticated ? 'none' : 'block';
        this.logoutBtn.style.display = isAuthenticated ? 'block' : 'none';
        this.messageInput.disabled = !isAuthenticated;
        this.sendBtn.disabled = !isAuthenticated;
        this.newChatBtn.disabled = !isAuthenticated;
        this.welcomeMessage.style.display = isAuthenticated ? 'none' : 'block';
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('active');
    }
    
    showLoginModal() {
        this.closeAllModals();
        this.loginModal.classList.add('active');
        document.getElementById('loginUsername').focus();
    }
    
    closeLoginModal() {
        this.loginModal.classList.remove('active');
        this.loginForm.reset();
    }
    
    showRegisterModal() {
        this.closeAllModals();
        this.registerModal.classList.add('active');
        document.getElementById('registerUsername').focus();
    }
    
    closeRegisterModal() {
        this.registerModal.classList.remove('active');
        this.registerForm.reset();
    }
    
    showNewChatModal() {
        this.closeAllModals();
        this.newChatModal.classList.add('active');
        document.getElementById('chatTitle').focus();
    }
    
    closeNewChatModal() {
        this.newChatModal.classList.remove('active');
        this.newChatForm.reset();
    }
    
    showConfirmModal(title, message, action) {
        this.confirmTitle.textContent = title;
        this.confirmMessage.textContent = message;
        this.confirmAction.onclick = action;
        this.confirmModal.classList.add('active');
    }
    
    closeConfirmModal() {
        this.confirmModal.classList.remove('active');
        this.confirmAction.onclick = null;
    }
    
    closeAllModals() {
        this.closeLoginModal();
        this.closeRegisterModal();
        this.closeNewChatModal();
        this.closeConfirmModal();
    }
    
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.user = data.user;
                this.updateUserInfo();
                this.updateUI();
                this.closeLoginModal();
                this.loadChats();
                this.showSuccess('Logged in successfully!');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            this.showError('Login failed. Please check your connection.');
        } finally {
            this.hideLoading();
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!username || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.user = data.user;
                this.updateUserInfo();
                this.updateUI();
                this.closeRegisterModal();
                this.loadChats();
                this.showSuccess('Registration successful!');
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showError('Registration failed. Please check your connection.');
        } finally {
            this.hideLoading();
        }
    }
    
    async logout() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.user = null;
                this.currentChatId = null;
                this.updateUserInfo();
                this.updateUI();
                this.clearMessages();
                this.clearChatList();
                this.showSuccess('Logged out successfully!');
            }
        } catch (error) {
            this.showError('Logout failed');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadChats() {
        if (!this.user) return;
        
        try {
            const response = await fetch('/api/chats');
            const data = await response.json();
            this.renderChatList(data.chats);
        } catch (error) {
            console.error('Load chats error:', error);
        }
    }
    
    renderChatList(chats) {
        this.chatList.innerHTML = '';
        
        if (chats.length === 0) {
            const noChats = document.createElement('div');
            noChats.className = 'no-chats';
            noChats.textContent = 'No chats yet. Start a new conversation!';
            this.chatList.appendChild(noChats);
            return;
        }
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (this.currentChatId === chat.chat_id) {
                chatItem.classList.add('active');
            }
            
            chatItem.innerHTML = `
                <span class="chat-icon">&#128172;</span>
                <span class="chat-title">${chat.title || 'New Chat'}</span>
                <span class="chat-date">${this.formatDate(chat.created_at)}</span>
            `;
            
            chatItem.addEventListener('click', () => this.loadChat(chat.chat_id));
            this.chatList.appendChild(chatItem);
        });
    }
    
    async handleNewChat(e) {
        e.preventDefault();
        const title = document.getElementById('chatTitle').value;
        const model = this.newChatModel.value;
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, model })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentChatId = data.chat.chat_id;
                this.currentModel = data.chat.model || model;
                this.modelName.textContent = this.currentModel;
                this.closeNewChatModal();
                this.loadChats();
                this.loadChat(this.currentChatId);
            } else {
                this.showError(data.error || 'Failed to create chat');
            }
        } catch (error) {
            this.showError('Failed to create chat');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadChat(chatId) {
        this.currentChatId = chatId;
        
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        try {
            const chat = await this.getChatInfo(chatId);
            if (chat) {
                this.currentModel = chat.model || 'llama3';
                this.modelName.textContent = this.currentModel;
                this.modelSelect.value = this.currentModel;
            }
        } catch (error) {
            console.error('Load chat info error:', error);
        }
        
        this.loadMessages(chatId);
        this.chatHeader.style.display = 'flex';
        this.deleteChatBtn.style.display = 'block';
    }
    
    async getChatInfo(chatId) {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json();
            return data.chats.find(c => c.chat_id === chatId);
        } catch (error) {
            return null;
        }
    }
    
    async loadMessages(chatId) {
        this.clearMessages();
        
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            const data = await response.json();
            
            if (data.messages.length === 0) {
                this.welcomeMessage.style.display = 'block';
            } else {
                this.welcomeMessage.style.display = 'none';
                data.messages.forEach(msg => this.renderMessage(msg));
            }
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Load messages error:', error);
            this.showError('Failed to load messages');
        }
    }
    
    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? 'U' : 'AI';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMessage(message.content);
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    formatMessage(content) {
        let formatted = content
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return formatted;
    }
    
    clearMessages() {
        this.messagesContainer.innerHTML = '';
        this.welcomeMessage.style.display = 'block';
    }
    
    clearChatList() {
        this.chatList.innerHTML = '<div class="no-chats">No chats yet. Start a new conversation!</div>';
    }
    
    async sendMessage() {
        const content = this.messageInput.value.trim();
        
        if (!content || !this.currentChatId || this.isSending) return;
        
        this.isSending = true;
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        
        this.welcomeMessage.style.display = 'none';
        this.renderMessage({
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        });
        
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message assistant typing-indicator';
        typingIndicator.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
        
        try {
            const response = await fetch(`/api/chats/${this.currentChatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    model: this.currentModel
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.messagesContainer.removeChild(typingIndicator);
                data.messages.forEach(msg => this.renderMessage(msg));
                this.loadChats();
            } else {
                this.messagesContainer.removeChild(typingIndicator);
                this.renderMessage({
                    role: 'assistant',
                    content: `Error: ${data.error || 'Failed to get response'}`,
                    created_at: new Date().toISOString()
                });
                this.showError(data.error || 'Failed to send message');
            }
        } catch (error) {
            if (typingIndicator.parentNode) {
                this.messagesContainer.removeChild(typingIndicator);
            }
            
            this.renderMessage({
                role: 'assistant',
                content: `Error: ${error.message}`,
                created_at: new Date().toISOString()
            });
            this.showError('Failed to send message');
        } finally {
            this.isSending = false;
            this.messageInput.disabled = false;
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }
    
    confirmDeleteChat() {
        if (!this.currentChatId) return;
        
        this.showConfirmModal(
            'Delete Chat',
            'Are you sure you want to delete this chat? This action cannot be undone.',
            () => this.deleteChat()
        );
    }
    
    async deleteChat() {
        if (!this.currentChatId) return;
        
        this.showLoading();
        
        try {
            const response = await fetch(`/api/chats/${this.currentChatId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentChatId = null;
                this.clearMessages();
                this.loadChats();
                this.chatHeader.style.display = 'none';
                this.deleteChatBtn.style.display = 'none';
                this.showSuccess('Chat deleted successfully!');
            } else {
                this.showError('Failed to delete chat');
            }
        } catch (error) {
            this.showError('Failed to delete chat');
        } finally {
            this.hideLoading();
            this.closeConfirmModal();
        }
    }
    
    executeConfirmAction() {
        if (this.confirmAction.onclick) {
            this.confirmAction.onclick();
        }
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('active');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }
    
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        if (this.messagesContainer.firstChild) {
            this.messagesContainer.insertBefore(errorElement, this.messagesContainer.firstChild);
        } else {
            this.messagesContainer.appendChild(errorElement);
        }
        
        this.scrollToBottom();
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
    
    showSuccess(message) {
        console.log('Success:', message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new OllamaChatApp();
});
