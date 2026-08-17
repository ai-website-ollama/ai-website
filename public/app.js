class ZigApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.chatList = document.getElementById('chatList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHeader = document.getElementById('chatHeader');
        this.chatTitle = document.getElementById('chatTitle');
        this.deleteChatBtn = document.getElementById('deleteChatBtn');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.userAvatar = document.getElementById('userAvatar');
        this.userInitial = document.getElementById('userInitial');
        this.userName = document.getElementById('userName');
        this.adminBtn = document.getElementById('adminBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.sidebarResizer = document.getElementById('sidebarResizer');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');

        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        this.settingsCompact = document.getElementById('settingsCompact');
        this.settingsTimestamps = document.getElementById('settingsTimestamps');
        this.settingsVoiceEnabled = document.getElementById('settingsVoiceEnabled');
        this.settingsAutoRecord = document.getElementById('settingsAutoRecord');

        this.webSearchBtn = document.getElementById('webSearchBtn');
        this.searchModal = document.getElementById('searchModal');
        this.closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
        this.cancelSearchBtn = document.getElementById('cancelSearchBtn');
        this.performSearchBtn = document.getElementById('performSearchBtn');
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');

        this.confirmModal = document.getElementById('confirmModal');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        this.currentChatId = null;
        this.currentModel = 'llama3.2';
        this.models = ['llama3.2'];
        this.user = null;
        this.isSending = false;
        this.confirmAction = null;
        this.currentSystemPrompt = null;
        this.uploadedText = null;
        this.uploadedFilename = null;
        this.csrfToken = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSidebarResizer();
        this.loadModels();
        this.checkSession();
        this.updateUI();
    }

    setupEventListeners() {
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.createNewChat());
        }
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        }
        document.querySelectorAll('.example-btn[data-example-prompt]').forEach(btn => {
            btn.addEventListener('click', () => this.useExample(btn.dataset.examplePrompt));
        });
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => { window.location.href = '/admin'; });
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
        const deleteAllBtn = document.getElementById('deleteAllChatsBtn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                if (!confirm('Delete ALL your chats? This cannot be undone.')) return;
                try {
                    const res = await fetch('/api/chats', { method: 'DELETE', headers: this.csrfHeaders() });
                    if (res.ok) location.reload();
                } catch (e) {}
            });
        }
        if (this.deleteChatBtn) {
            this.deleteChatBtn.addEventListener('click', () => this.confirmDeleteChat());
        }
        if (this.confirmModal) {
            this.confirmModal.addEventListener('click', (e) => {
                if (e.target === this.confirmModal) this.closeConfirmModal();
            });
        }
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        if (this.cancelSettingsBtn) {
            this.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        if (this.closeSettingsModalBtn) {
            this.closeSettingsModalBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.closeSettingsModal();
            });
        }
        const uploadBtn = document.getElementById('uploadBtn');
        const fileUpload = document.getElementById('fileUpload');
        const removeUpload = document.getElementById('removeUpload');
        if (uploadBtn && fileUpload) {
            uploadBtn.addEventListener('click', () => fileUpload.click());
            fileUpload.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
        }
        if (removeUpload) {
            removeUpload.addEventListener('click', () => this.clearUpload());
        }
        if (this.webSearchBtn) {
            this.webSearchBtn.addEventListener('click', () => this.showSearchModal());
        }
        if (this.performSearchBtn) {
            this.performSearchBtn.addEventListener('click', () => this.performSearch());
        }
        if (this.cancelSearchBtn) {
            this.cancelSearchBtn.addEventListener('click', () => this.closeSearchModal());
        }
        if (this.closeSearchModalBtn) {
            this.closeSearchModalBtn.addEventListener('click', () => this.closeSearchModal());
        }
        if (this.searchModal) {
            this.searchModal.addEventListener('click', (e) => {
                if (e.target === this.searchModal) this.closeSearchModal();
            });
        }
        if (this.messagesContainer) {
            this.messagesContainer.addEventListener('click', async (e) => {
                const copyBtn = e.target.closest('.copy-code-btn');
                if (!copyBtn) return;
                const code = copyBtn.closest('.code-block')?.querySelector('code')?.textContent || '';
                if (!code) return;
                await navigator.clipboard.writeText(code);
                copyBtn.textContent = 'Copied';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
        const submitVerifyBtn = document.getElementById('submitVerifyBtn');
        if (submitVerifyBtn) {
            submitVerifyBtn.addEventListener('click', () => this.submitVerification());
        }
        const verifyCodeInput = document.getElementById('verifyCodeInput');
        if (verifyCodeInput) {
            verifyCodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.submitVerification(); }
            });
        }
    }

    setupSidebarResizer() {
        if (!this.sidebar) return;
        try {
            const saved = localStorage.getItem('sidebarWidth');
            if (saved) this.sidebar.style.width = saved;
        } catch (e) {}
        if (!this.sidebarResizer) return;
        let isResizing = false;
        const minWidth = 180;
        const maxWidth = 720;
        const startResize = (e) => {
            isResizing = true;
            this.sidebarResizer.classList.add('active');
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        };
        const doResize = (e) => {
            if (!isResizing) return;
            const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
            const rect = this.sidebar.getBoundingClientRect();
            let newWidth = clientX - rect.left;
            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            this.sidebar.style.width = newWidth + 'px';
            try { localStorage.setItem('sidebarWidth', this.sidebar.style.width); } catch (err) {}
        };
        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            this.sidebarResizer.classList.remove('active');
            document.body.style.cursor = '';
        };
        this.sidebarResizer.addEventListener('mousedown', startResize);
        this.sidebarResizer.addEventListener('touchstart', startResize, { passive: false });
        document.addEventListener('mousemove', doResize);
        document.addEventListener('touchmove', doResize, { passive: false });
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        this.sidebarResizer.addEventListener('dblclick', () => {
            this.sidebar.style.width = '';
            try { localStorage.removeItem('sidebarWidth'); } catch (e) {}
        });
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
            if (this.sidebarOverlay) this.sidebarOverlay.classList.toggle('active', this.sidebar.classList.contains('active'));
        }
    }

    closeSidebar() {
        if (this.sidebar) this.sidebar.classList.remove('active');
        if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('active');
    }

    async checkSession() {
        try {
            const response = await fetch('/api/session');
            const data = await response.json();
            if (data.success && data.user) {
                this.user = data.user;
                this.csrfToken = data.csrfToken || null;
                this.updateUserInfo();
                this.updateUI();
                this.loadChats();
                if (data.user.verified === false) {
                    this.showVerifyModal();
                } else {
                    setTimeout(() => { if (this.messageInput) this.messageInput.focus(); }, 500);
                }
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Session check error:', error);
            window.location.href = '/login';
        }
    }

    updateUserInfo() {
        if (!this.user) return;
        if (this.userInitial) this.userInitial.textContent = this.user.username.charAt(0).toUpperCase();
        if (this.userName) this.userName.textContent = this.user.username;
    }

    updateUI() {
        if (this.adminBtn) {
            this.adminBtn.style.display = (this.user && this.user.isAdmin) ? 'flex' : 'none';
        }
        if (this.messageInput) this.messageInput.disabled = !this.user;
        if (this.sendBtn) this.sendBtn.disabled = !this.user;
        if (this.newChatBtn) this.newChatBtn.disabled = !this.user;
    }

    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            if (data.success && data.models) {
                this.models = data.models;
                this.currentModel = data.models[0] || 'llama3.2';
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }

    async loadChats() {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json();
            if (data.success) this.renderChatList(data.chats);
        } catch (error) {
            console.error('Load chats error:', error);
        }
    }

    renderChatList(chats) {
        if (!this.chatList) return;
        this.chatList.innerHTML = '';
        if (!chats || chats.length === 0) {
            this.chatList.innerHTML = '<div class="no-chats"><svg class="no-chats-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>No chats yet</p><p class="no-chats-sub">Start a conversation</p></div>';
            return;
        }
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-item' + (chat.chat_id === this.currentChatId ? ' active' : '');
            item.dataset.chatId = chat.chat_id;
            item.innerHTML = '<svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="chat-title">' + this.escapeHtml(chat.title || 'New Chat') + '</span><span class="chat-date">' + this.formatDate(chat.created_at) + '</span>';
            item.addEventListener('click', () => this.loadChat(chat.chat_id));
            this.chatList.appendChild(item);
        });
    }

    async createNewChat() {
        if (!this.user) { window.location.href = '/login'; return null; }
        this.closeSidebar();
        this.showLoading();
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.csrfHeaders() },
                body: JSON.stringify({ model: this.currentModel })
            });
            const data = await response.json();
            if (data.success) {
                this.currentChatId = data.chat.chat_id;
                this.loadChats();
                this.loadChat(this.currentChatId);
                return data.chat.chat_id;
            } else {
                this.showError(data.error || 'Failed to create chat');
                return null;
            }
        } catch (error) {
            this.showError('Failed to create chat');
            return null;
        } finally {
            this.hideLoading();
        }
    }

    async loadChat(chatId) {
        this.currentChatId = chatId;
        this.closeSidebar();
        if (this.chatList) {
            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
            const activeItem = document.querySelector('.chat-item[data-chat-id="' + chatId + '"]');
            if (activeItem) activeItem.classList.add('active');
        }
        this.loadMessages(chatId);
        if (this.chatHeader) this.chatHeader.style.display = 'flex';
        if (this.deleteChatBtn) this.deleteChatBtn.style.display = 'flex';
        try {
            const chat = await this.getChatInfo(chatId);
            if (chat && this.chatTitle) {
                this.chatTitle.textContent = chat.title || 'New Chat';
                this.currentSystemPrompt = chat.system_prompt || null;
            }
        } catch (error) {
            console.error('Load chat info error:', error);
        }
    }

    async getChatInfo(chatId) {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json();
            if (data.success) return data.chats.find(c => c.chat_id === chatId);
            return null;
        } catch (error) { return null; }
    }

    async loadMessages(chatId) {
        if (!this.messagesContainer) return;
        this.clearMessages();
        try {
            const response = await fetch('/api/chats/' + chatId + '/messages');
            const data = await response.json();
            if (data.success) {
                if (data.messages.length === 0) {
                    if (this.welcomeMessage) this.welcomeMessage.style.display = 'flex';
                } else {
                    if (this.welcomeMessage) this.welcomeMessage.style.display = 'none';
                    data.messages.forEach(msg => this.renderMessage(msg));
                }
            }
            this.scrollToBottom();
        } catch (error) {
            console.error('Load messages error:', error);
            this.showError('Failed to load messages');
        }
    }

    renderMessage(message) {
        if (!this.messagesContainer) return;
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + message.role;
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? (this.userInitial ? this.userInitial.textContent : 'U') : 'AI';
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMessage(message.content);
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatMessage(content) {
        if (!content) return '';
        let formatted = content;
        let i = 0;
        const codeBlocks = [];
        formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
            const token = '__CODEBLOCK_' + (i++) + '__';
            const html = '<div class="code-block"><div class="code-block-header"><span>' + (lang || 'code') + '</span><button class="copy-code-btn" type="button">Copy</button></div><pre><code>' + this.escapeHtml(code) + '</code></pre></div>';
            codeBlocks.push({ token, html });
            return token;
        });
        formatted = this.escapeHtml(formatted);
        formatted = formatted
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        codeBlocks.forEach(({ token, html }) => {
            formatted = formatted.replace(token, html);
        });
        return formatted;
    }

    clearMessages() {
        if (this.messagesContainer) this.messagesContainer.innerHTML = '';
        if (this.welcomeMessage) this.welcomeMessage.style.display = 'flex';
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content && !this.uploadedText) return;
        if (this.isSending) return;
        if (!this.currentChatId) {
            const chatId = await this.createNewChat();
            if (!chatId) return;
            this.currentChatId = chatId;
        }

        let fullContent = content;
        if (this.uploadedText) {
            fullContent = content
                ? `[File: ${this.uploadedFilename}]\n\n${this.uploadedText}\n\n---\n\n${content}`
                : `[File: ${this.uploadedFilename}]\n\nPlease analyze this file.`;
        }

        this.isSending = true;
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        if (this.welcomeMessage) this.welcomeMessage.style.display = 'none';
        this.renderMessage({ role: 'user', content: content + (this.uploadedText ? '\n\n📎 ' + this.uploadedFilename : ''), created_at: new Date().toISOString() });
        this.messageInput.value = '';
        this.clearUpload();
        this.autoResizeTextarea();
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message assistant typing-indicator';
        typingIndicator.innerHTML = '<div class="message-avatar">AI</div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        this.messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
        try {
            const response = await fetch('/api/chats/' + this.currentChatId + '/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.csrfHeaders() },
                body: JSON.stringify({ content: fullContent })
            });
            const data = await response.json();
            if (data.success) {
                this.messagesContainer.removeChild(typingIndicator);
                data.messages.forEach(msg => this.renderMessage(msg));
                this.loadChats();
            } else {
                this.messagesContainer.removeChild(typingIndicator);
                this.renderMessage({ role: 'assistant', content: 'Error: ' + (data.error || 'Failed to get response'), created_at: new Date().toISOString() });
                this.showError(data.error || 'Failed to send message');
            }
        } catch (error) {
            if (typingIndicator.parentNode) this.messagesContainer.removeChild(typingIndicator);
            this.renderMessage({ role: 'assistant', content: 'Error: ' + error.message, created_at: new Date().toISOString() });
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
        this.showConfirmModal('Delete chat', 'Are you sure you want to delete this chat? This action cannot be undone.', () => this.deleteChat());
    }

    async deleteChat() {
        if (!this.currentChatId) return;
        this.showLoading();
        try {
            const response = await fetch('/api/chats/' + this.currentChatId, { method: 'DELETE', headers: this.csrfHeaders() });
            const data = await response.json();
            if (data.success) {
                this.currentChatId = null;
                this.clearMessages();
                this.loadChats();
                if (this.chatHeader) this.chatHeader.style.display = 'none';
                if (this.deleteChatBtn) this.deleteChatBtn.style.display = 'none';
            } else {
                this.showError(data.error || 'Failed to delete chat');
            }
        } catch (error) {
            this.showError('Failed to delete chat');
        } finally {
            this.hideLoading();
            this.closeConfirmModal();
        }
    }

    showConfirmModal(title, message, action) {
        if (!this.confirmModal) return;
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        this.confirmAction = action;
        this.confirmModal.classList.add('active');
    }

    closeConfirmModal() {
        if (this.confirmModal) this.confirmModal.classList.remove('active');
        this.confirmAction = null;
    }

    closeAllModals() {
        this.closeConfirmModal();
        this.closeSettingsModal();
        this.closeSearchModal();
    }

    executeConfirmAction() {
        if (this.confirmAction) this.confirmAction();
    }

    showSettingsModal() {
        this.loadUserSettings().then(settings => {
            const s = settings || {};
            const appearance = s.appearance || {};
            const voice = s.voice || {};

            const initial = this.userInitial ? this.userInitial.textContent : (this.user?.username || '?')[0].toUpperCase();
            const username = this.user?.username || 'unknown';
            const age = this.user?.age ?? 18;

            if (document.getElementById('settingsAvatar')) document.getElementById('settingsAvatar').textContent = initial;
            if (document.getElementById('settingsUsername')) document.getElementById('settingsUsername').textContent = username;
            if (document.getElementById('settingsAgeInfo')) {
                document.getElementById('settingsAgeInfo').textContent = age >= 18 ? 'Age ' + age + ' (unrestricted)' : 'Age ' + age + ' (content filtered)';
            }

            if (this.settingsCompact) this.settingsCompact.checked = !!appearance.compact;
            if (this.settingsTimestamps) this.settingsTimestamps.checked = appearance.timestamps !== false;
            if (this.settingsVoiceEnabled) this.settingsVoiceEnabled.checked = voice.enabled !== false;
            if (this.settingsAutoRecord) this.settingsAutoRecord.checked = !!voice.autoRecord;

            if (this.settingsModal) this.settingsModal.classList.add('active');
        }).catch(() => {
            if (this.settingsModal) this.settingsModal.classList.add('active');
        });
    }

    closeSettingsModal() {
        if (this.settingsModal) this.settingsModal.classList.remove('active');
    }

    async saveSettings() {
        const settings = {
            appearance: {
                compact: this.settingsCompact ? this.settingsCompact.checked : false,
                timestamps: this.settingsTimestamps ? this.settingsTimestamps.checked : true
            },
            voice: {
                enabled: this.settingsVoiceEnabled ? this.settingsVoiceEnabled.checked : true,
                autoRecord: this.settingsAutoRecord ? this.settingsAutoRecord.checked : false
            }
        };
        this.showLoading();
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.csrfHeaders() },
                body: JSON.stringify({ settings })
            });
            const data = await res.json();
            if (data.success) {
                this.closeSettingsModal();
                this.showError('Settings saved');
                if (this.settingsCompact) document.body.classList.toggle('compact', this.settingsCompact.checked);
            } else {
                this.showError(data.error || 'Failed to save settings');
            }
        } catch (err) {
            this.showError('Failed to save settings');
        } finally {
            this.hideLoading();
        }
    }

    showSearchModal() {
        if (this.searchModal) this.searchModal.classList.add('active');
    }

    closeSearchModal() {
        if (this.searchModal) this.searchModal.classList.remove('active');
        if (this.searchResults) this.searchResults.innerHTML = '';
        if (this.searchInput) this.searchInput.value = '';
    }

    injectSearchResult(url, title) {
        this.closeSearchModal();
        if (this.messageInput) {
            const current = this.messageInput.value.trim();
            this.messageInput.value = current
                ? current + '\n\nSearch result: ' + title + '\n' + url
                : 'Look up this result for me: ' + title + '\n' + url;
            this.messageInput.focus();
            this.autoResizeTextarea();
        }
    }

    async performSearch() {
        const q = this.searchInput ? this.searchInput.value.trim() : '';
        if (!q) return this.showError('Enter a search query');
        if (this.searchResults) this.searchResults.innerHTML = '<div class="example-btn">Searching...</div>';
        try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (data.success) {
                const results = data.results || [];
                if (results.length === 0) {
                    this.searchResults.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">No results found</div>';
                } else {
                    this.searchResults.innerHTML = results.map((r, idx) =>
                        '<div class="search-result-item" data-url="' + this.escapeHtml(r.url) + '" data-title="' + this.escapeHtml(r.title) + '">' +
                            '<div style="font-weight:600;color:var(--accent-primary);font-size:14px;margin-bottom:4px;">' + this.escapeHtml(r.title) + '</div>' +
                            '<div style="font-size:11px;color:var(--text-muted);word-break:break-all;margin-bottom:4px;">' + this.escapeHtml(r.url) + '</div>' +
                            (r.snippet ? '<div style="font-size:13px;color:var(--text-secondary);">' + this.escapeHtml(r.snippet) + '</div>' : '') +
                        '</div>'
                    ).join('');
                    this.searchResults.querySelectorAll('.search-result-item').forEach(el => {
                        el.addEventListener('click', () => {
                            this.injectSearchResult(el.dataset.url, el.dataset.title);
                        });
                    });
                }
            } else {
                this.searchResults.innerHTML = '<div class="error-message">Search failed</div>';
            }
        } catch (err) {
            this.searchResults.innerHTML = '<div class="error-message">Search error</div>';
        }
    }

    async logout() {
        this.showLoading();
        try {
            const response = await fetch('/api/logout', { method: 'POST', headers: this.csrfHeaders() });
            if (response.ok) {
                this.user = null;
                this.currentChatId = null;
                this.updateUserInfo();
                this.updateUI();
                this.clearMessages();
                window.location.href = '/login';
            }
        } catch (error) {
            this.showError('Logout failed');
        } finally {
            this.hideLoading();
        }
    }

    useExample(prompt) {
        if (!this.user) { window.location.href = '/login'; return; }
        if (!this.currentChatId) {
            this.createNewChat().then(() => {
                setTimeout(() => {
                    this.messageInput.value = prompt;
                    this.sendMessage();
                }, 500);
            });
        } else {
            this.messageInput.value = prompt;
            this.sendMessage();
        }
    }

    autoResizeTextarea() {
        if (!this.messageInput) return;
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async handleFileUpload(file) {
        if (!file) return;
        const safeName = file.name.replace(/[<>"'&\\\/]/g, '_').substring(0, 100);
        const preview = document.getElementById('uploadPreview');
        const fileName = document.getElementById('uploadFileName');
        const status = document.getElementById('uploadStatus');
        if (preview) preview.style.display = 'flex';
        if (fileName) fileName.textContent = file.name;
        if (status) status.textContent = 'Uploading...';
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', headers: this.csrfHeaders(), body: formData });
            const data = await res.json();
            if (data.success) {
                this.uploadedText = data.text;
                this.uploadedFilename = safeName;
                if (status) status.textContent = data.chars + ' chars extracted';
                if (this.sendBtn) this.sendBtn.disabled = false;
            } else {
                if (status) status.textContent = 'Error: ' + (data.error || 'Failed');
                this.clearUpload();
            }
        } catch (e) {
            if (status) status.textContent = 'Upload failed';
            this.clearUpload();
        }
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) fileUpload.value = '';
    }

    clearUpload() {
        this.uploadedText = null;
        this.uploadedFilename = null;
        const preview = document.getElementById('uploadPreview');
        if (preview) preview.style.display = 'none';
    }

    async changePassword() {
        const currentPw = document.getElementById('settingsCurrentPw')?.value || '';
        const newPw = document.getElementById('settingsNewPw')?.value || '';
        const code = document.getElementById('settingsPwCode')?.value || '';
        const result = document.getElementById('pwChangeResult');
        if (!currentPw || !newPw) { if (result) { result.textContent = 'Fill all fields'; result.style.color = 'var(--danger)'; } return; }
        if (newPw.length < 8) { if (result) { result.textContent = 'Min 8 chars'; result.style.color = 'var(--danger)'; } return; }
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.csrfHeaders() },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, code })
            });
            const data = await res.json();
            if (data.success) {
                if (result) { result.textContent = 'Password changed!'; result.style.color = 'var(--success)'; }
                document.getElementById('settingsCurrentPw').value = '';
                document.getElementById('settingsNewPw').value = '';
                document.getElementById('settingsPwCode').value = '';
            } else {
                if (result) { result.textContent = data.error || 'Failed'; result.style.color = 'var(--danger)'; }
            }
        } catch (e) {
            if (result) { result.textContent = 'Failed'; result.style.color = 'var(--danger)'; }
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));
        if (days > 0) return days + 'd ago';
        if (hours > 0) return hours + 'h ago';
        if (minutes > 0) return minutes + 'm ago';
        return 'Just now';
    }

    showLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.remove('active');
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        if (this.messagesContainer && this.messagesContainer.firstChild) {
            this.messagesContainer.insertBefore(errorElement, this.messagesContainer.firstChild);
        } else if (this.messagesContainer) {
            this.messagesContainer.appendChild(errorElement);
        }
        this.scrollToBottom();
        setTimeout(() => { errorElement.remove(); }, 5000);
    }

    async loadUserSettings() {
        try {
            const res = await fetch('/api/user/settings');
            const data = await res.json();
            if (data.success) return data.settings || {};
            return {};
        } catch (e) { return {}; }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    csrfHeaders() {
        return this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {};
    }

    showVerifyModal() {
        const modal = document.getElementById('verifyModal');
        if (modal) modal.classList.add('active');
        const input = document.getElementById('verifyCodeInput');
        if (input) { input.value = ''; input.focus(); }
        const err = document.getElementById('verifyError');
        if (err) err.style.display = 'none';
    }

    async submitVerification() {
        const input = document.getElementById('verifyCodeInput');
        const err = document.getElementById('verifyError');
        const code = input ? input.value.trim() : '';
        if (!code) {
            if (err) { err.textContent = 'Please enter a code'; err.style.display = 'block'; }
            return;
        }
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.csrfHeaders() },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.success) {
                const modal = document.getElementById('verifyModal');
                if (modal) modal.classList.remove('active');
                this.user.verified = true;
                setTimeout(() => { if (this.messageInput) this.messageInput.focus(); }, 300);
            } else {
                if (err) { err.textContent = data.error || 'Invalid code'; err.style.display = 'block'; }
            }
        } catch (error) {
            if (err) { err.textContent = 'Verification failed'; err.style.display = 'block'; }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZigApp();
    window.closeConfirmModal = () => window.app.closeConfirmModal();
    window.executeConfirmAction = () => window.app.executeConfirmAction();
});
