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
    this.userInitial = document.getElementById('userInitial');
    this.userName = document.getElementById('userName');
    this.adminBtn = document.getElementById('adminBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.confirmModal = document.getElementById('confirmModal');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.settingsModal = document.getElementById('settingsModal');

<<<<<<< HEAD
    this.currentChatId = localStorage.getItem('zig.currentChatId') || null;
    this.user = null;
    this.isSending = false;
    this.confirmAction = null;

    this.bindEvents();
    this.checkSession();
  }

  bindEvents() {
    this.mobileMenuBtn?.addEventListener('click', () => this.sidebar?.classList.toggle('active'));
    this.newChatBtn?.addEventListener('click', () => this.createNewChat());
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.logoutBtn?.addEventListener('click', () => this.logout());
    this.settingsBtn?.addEventListener('click', () => this.openSettingsModal());
    this.adminBtn?.addEventListener('click', () => { window.location.href = '/admin'; });
    this.deleteChatBtn?.addEventListener('click', () => this.confirmDeleteChat());
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettingsModal());
    document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => this.closeSettingsModal());
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());

    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => this.useExample(btn.dataset.examplePrompt || ''));
    });

    this.messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.messageInput?.addEventListener('input', () => this.autoResizeTextarea());

    this.messagesContainer?.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.copy-code-btn');
      if (!copyBtn) return;
      const code = copyBtn.closest('.code-block')?.querySelector('code')?.textContent || '';
      if (!code) return;
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1200);
    });

    this.confirmModal?.addEventListener('click', (e) => {
      if (e.target === this.confirmModal) this.closeConfirmModal();
    });
    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettingsModal();
    });
  }

  async checkSession() {
    const res = await fetch('/api/session');
    const data = await res.json();
    this.user = data.success ? data.user : null;
    this.updateUserInfo();
    this.updateUI();
    if (this.user) {
      await this.loadSettings();
      await this.loadChats();
    }
  }

  updateUserInfo() {
    if (this.user) {
      this.userInitial.textContent = this.user.username.charAt(0).toUpperCase();
      this.userName.textContent = this.user.username;
    } else {
      this.userInitial.textContent = 'U';
      this.userName.textContent = 'User';
    }
  }

  updateUI() {
    const authed = Boolean(this.user);
    this.messageInput.disabled = !authed;
    this.sendBtn.disabled = !authed;
    this.newChatBtn.disabled = !authed;
    this.adminBtn.style.display = authed && this.user.isAdmin ? 'flex' : 'none';
    if (!this.currentChatId) {
      this.showWelcome();
=======
class ClaudeApp {
    constructor() {
        // DOM Elements
        this.sidebar = document.getElementById('sidebar');
        this.chatList = document.getElementById('chatList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHeader = document.getElementById('chatHeader');
        this.chatTitle = document.getElementById('chatTitle');
        // modelSelect removed - Zig uses a single recommended model
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

        // Settings modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        this.intSpotify = document.getElementById('intSpotify');
        this.spotifyEndpoint = document.getElementById('spotifyEndpoint');
        this.intHomeAssistant = document.getElementById('intHomeAssistant');
        this.homeAssistantEndpoint = document.getElementById('homeAssistantEndpoint');
        this.intCanva = document.getElementById('intCanva');
        this.canvaEndpoint = document.getElementById('canvaEndpoint');

        // Search modal elements
        this.webSearchBtn = document.getElementById('webSearchBtn');
        this.searchModal = document.getElementById('searchModal');
        this.closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
        this.cancelSearchBtn = document.getElementById('cancelSearchBtn');
        this.performSearchBtn = document.getElementById('performSearchBtn');
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        
        // Modals
        this.confirmModal = document.getElementById('confirmModal');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // State
        this.currentChatId = null;
        this.currentModel = 'llama3.2';
        this.models = ['llama3.2'];
        this.user = null;
        this.isSending = false;
        this.confirmAction = null;
        this.currentSystemPrompt = null;
        
        // Initialize
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
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        // New chat button
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.createNewChat());
        }
        
        // Send message
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Input events
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        }
        
        // Admin button
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => {
                window.location.href = '/admin';
            });
        }
        
        // Logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Delete chat
        if (this.deleteChatBtn) {
            this.deleteChatBtn.addEventListener('click', () => this.confirmDeleteChat());
        }
        
        // Model select change
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
            });
        }
        
        // Modal close on outside click (confirm modal)
        if (this.confirmModal) {
            this.confirmModal.addEventListener('click', (e) => {
                if (e.target === this.confirmModal) {
                    this.closeConfirmModal();
                }
            });
        }

        // System prompt modal listeners and buttons
        if (this.editSystemPromptBtn) {
            this.editSystemPromptBtn.addEventListener('click', () => this.showSystemPromptModal());
        }
        if (this.saveSystemPromptBtn) {
            this.saveSystemPromptBtn.addEventListener('click', () => this.saveSystemPrompt());
        }
        // Settings modal listeners
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

        // Web search modal listeners
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

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
>>>>>>> origin/main
    }
  }

  showWelcome() {
    if (this.welcomeMessage) this.welcomeMessage.style.display = 'flex';
  }

  hideWelcome() {
    if (this.welcomeMessage) this.welcomeMessage.style.display = 'none';
  }

  async loadChats() {
    const res = await fetch('/api/chats');
    const data = await res.json();
    if (!data.success) return;
    this.renderChatList(data.chats);

    if (!data.chats?.length) {
      this.currentChatId = null;
      localStorage.removeItem('zig.currentChatId');
      this.chatHeader.style.display = 'none';
      this.showWelcome();
      return;
    }

    if (this.currentChatId && data.chats.some(c => c.chat_id === this.currentChatId)) {
      this.loadChat(this.currentChatId);
      return;
    }

    this.currentChatId = data.chats[0].chat_id;
    localStorage.setItem('zig.currentChatId', this.currentChatId);
    this.loadChat(this.currentChatId);
  }

  renderChatList(chats) {
    this.chatList.innerHTML = '';
    if (!chats?.length) {
      this.chatList.innerHTML = `
        <div class="no-chats">
          <svg class="no-chats-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No chats yet</p>
          <p class="no-chats-sub">Start a conversation</p>
        </div>
      `;
      return;
    }
    chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = `chat-item ${this.currentChatId === chat.chat_id ? 'active' : ''}`;
      item.dataset.chatId = chat.chat_id;
      item.innerHTML = `
        <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chat-title">${this.escapeHtml(chat.title || 'New chat')}</span>
        <span class="chat-date">${this.formatDate(chat.created_at)}</span>
      `;
      item.addEventListener('click', () => this.loadChat(chat.chat_id));
      this.chatList.appendChild(item);
    });
  }

  async createNewChat() {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!data.success) {
      this.showError(data.error || 'Failed to create chat');
      return null;
    }
    await this.loadChats();
    this.loadChat(data.chat.chat_id);
    return data.chat.chat_id;
  }

  async loadChat(chatId) {
    this.currentChatId = chatId;
    localStorage.setItem('zig.currentChatId', chatId);
    this.chatHeader.style.display = 'flex';
    this.deleteChatBtn.style.display = 'flex';
    document.querySelectorAll('.chat-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (active) active.classList.add('active');

    const chatsRes = await fetch('/api/chats');
    const chatsData = await chatsRes.json();
    const chat = chatsData.success ? chatsData.chats.find(c => c.chat_id === chatId) : null;
    this.chatTitle.textContent = chat?.title || 'New chat';

    const res = await fetch(`/api/chats/${chatId}/messages`);
    const data = await res.json();
    this.messagesContainer.innerHTML = '';
    if (!data.success || !data.messages.length) {
      this.showWelcome();
      return;
    }
    this.hideWelcome();
    data.messages.forEach(m => this.renderMessage(m));
    this.scrollToBottom();
  }

  async sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || this.isSending || !this.user) return;
    if (!this.currentChatId) {
      const chatId = await this.createNewChat();
      if (!chatId) return;
      this.currentChatId = chatId;
    }

<<<<<<< HEAD
    this.isSending = true;
    this.sendBtn.disabled = true;
    this.messageInput.disabled = true;
    this.hideWelcome();

    this.renderMessage({ role: 'user', content });
    this.messageInput.value = '';
    this.autoResizeTextarea();

    const typing = document.createElement('div');
    typing.className = 'message assistant';
    typing.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
    `;
    this.messagesContainer.appendChild(typing);
    this.scrollToBottom();

    try {
      const res = await fetch(`/api/chats/${this.currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      typing.remove();
      if (!data.success) {
        this.showError(data.error || 'Failed to send message');
        return;
      }
      const assistant = [...data.messages].reverse().find(m => m.role === 'assistant');
      if (assistant) this.renderMessage(assistant);
      await this.loadChats();
    } catch (err) {
      typing.remove();
      this.showError(err.message || 'Failed to send message');
    } finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.messageInput.disabled = false;
      this.messageInput.focus();
=======
    setupSidebarResizer() {
        if (!this.sidebar) return;
        // load saved width
        try {
            const saved = localStorage.getItem('sidebarWidth');
            if (saved) {
                this.sidebar.style.width = saved;
            }
        } catch (e) {
            // ignore
        }

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

        // double click to reset to CSS variable/default
        this.sidebarResizer.addEventListener('dblclick', () => {
            this.sidebar.style.width = '';
            try { localStorage.removeItem('sidebarWidth'); } catch (e) {}
        });
    }

    async createNewChat() {
        if (!this.user) {
            window.location.href = '/login';
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.currentModel })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentChatId = data.chat.chat_id;
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
>>>>>>> origin/main
    }
  }

  renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.role}`;
    messageEl.innerHTML = `
      <div class="message-avatar">${message.role === 'user' ? this.userInitial.textContent : 'AI'}</div>
      <div class="message-content">${this.formatMessage(message.content || '')}</div>
    `;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  formatMessage(text) {
    const escaped = this.escapeHtml(text);
    const blocks = [];
    let i = 0;
    let out = escaped.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const token = `__CODEBLOCK_${i++}__`;
      const html = `
        <div class="code-block">
          <div class="code-block-header">
            <span>${lang || 'code'}</span>
            <button class="copy-code-btn" type="button">Copy</button>
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;
      blocks.push({ token, html });
      return token;
    });

    out = out
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    blocks.forEach(({ token, html }) => {
      out = out.replace(token, html);
    });

    return out;
  }

  escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  confirmDeleteChat() {
    if (!this.currentChatId) return;
    this.showConfirmModal('Delete chat', 'Are you sure you want to delete this chat?', () => this.deleteChat());
  }

  async deleteChat() {
    const res = await fetch(`/api/chats/${this.currentChatId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) {
      this.showError(data.error || 'Failed to delete chat');
      return;
    }
    this.currentChatId = null;
    localStorage.removeItem('zig.currentChatId');
    this.closeConfirmModal();
    await this.loadChats();
  }

  showConfirmModal(title, message, action) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    this.confirmAction = action;
    this.confirmModal.classList.add('active');
  }

  closeConfirmModal() {
    this.confirmAction = null;
    this.confirmModal.classList.remove('active');
  }

  executeConfirmAction() {
    if (this.confirmAction) this.confirmAction();
  }

  async logout() {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.removeItem('zig.currentChatId');
    window.location.href = '/login';
  }

  useExample(prompt) {
    this.messageInput.value = prompt;
    this.autoResizeTextarea();
    this.messageInput.focus();
  }

  autoResizeTextarea() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = `${Math.min(this.messageInput.scrollHeight, 120)}px`;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  showError(message) {
    const el = document.createElement('div');
    el.className = 'error-message';
    el.textContent = message;
    this.messagesContainer.prepend(el);
    setTimeout(() => el.remove(), 4000);
  }

  async loadSettings() {
    const res = await fetch('/api/user/settings');
    const data = await res.json();
    if (!data.success) return;
    const s = data.settings || {};
    document.getElementById('spotifyClientId').value = s.oauth?.spotifyClientId || '';
    document.getElementById('spotifyRedirectUri').value = s.oauth?.spotifyRedirectUri || '';
    document.getElementById('homeAssistantUrl').value = s.oauth?.homeAssistantUrl || '';
    document.getElementById('canvaClientId').value = s.oauth?.canvaClientId || '';
    document.getElementById('accentColor').value = s.colors?.accent || '#6366f1';
    document.getElementById('userBubbleColor').value = s.colors?.userBubble || '#6366f1';
    document.getElementById('assistantBubbleColor').value = s.colors?.assistantBubble || '#252525';
    this.applyColors(s.colors || {});
  }

  async saveSettings() {
    const settings = {
      oauth: {
        spotifyClientId: document.getElementById('spotifyClientId').value.trim(),
        spotifyRedirectUri: document.getElementById('spotifyRedirectUri').value.trim(),
        homeAssistantUrl: document.getElementById('homeAssistantUrl').value.trim(),
        canvaClientId: document.getElementById('canvaClientId').value.trim()
      },
      colors: {
        accent: document.getElementById('accentColor').value,
        userBubble: document.getElementById('userBubbleColor').value,
        assistantBubble: document.getElementById('assistantBubbleColor').value
      }
    };
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!data.success) {
      this.showError(data.error || 'Failed to save settings');
      return;
    }
<<<<<<< HEAD
    this.applyColors(settings.colors);
    this.closeSettingsModal();
  }

  applyColors(colors) {
    if (colors.accent) {
      document.documentElement.style.setProperty('--accent-primary', colors.accent);
      document.documentElement.style.setProperty('--user-bg', colors.accent);
    }
    if (colors.userBubble) document.documentElement.style.setProperty('--user-bg', colors.userBubble);
    if (colors.assistantBubble) document.documentElement.style.setProperty('--assistant-bg', colors.assistantBubble);
  }

  openSettingsModal() {
    this.settingsModal.classList.add('active');
  }

  closeSettingsModal() {
    this.settingsModal.classList.remove('active');
  }
}

=======
    
    async loadChat(chatId) {
        this.currentChatId = chatId;
        
        // Update active chat in list
        if (this.chatList) {
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Load messages
        this.loadMessages(chatId);
        
        // Update header
        if (this.chatHeader) {
            this.chatHeader.style.display = 'flex';
        }
        if (this.deleteChatBtn) {
            this.deleteChatBtn.style.display = 'flex';
        }
        
        // Update chat title
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
            if (data.success) {
                return data.chats.find(c => c.chat_id === chatId);
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    async loadMessages(chatId) {
        if (!this.messagesContainer) return;
        
        this.clearMessages();
        
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            const data = await response.json();
            
            if (data.success) {
                if (data.messages.length === 0) {
                    if (this.welcomeMessage) {
                        this.welcomeMessage.style.display = 'flex';
                    }
                } else {
                    if (this.welcomeMessage) {
                        this.welcomeMessage.style.display = 'none';
                    }
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
        messageElement.className = `message ${message.role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? this.userInitial.textContent : 'AI';
        
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
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
        if (this.welcomeMessage) {
            this.welcomeMessage.style.display = 'flex';
        }
    }
    
    async sendMessage() {
        const content = this.messageInput.value.trim();
        
        if (!content || !this.currentChatId || this.isSending) return;
        
        this.isSending = true;
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        
        if (this.welcomeMessage) {
            this.welcomeMessage.style.display = 'none';
        }
        
        // Show user message immediately
        this.renderMessage({
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        });
        
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator
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
            
            if (data.success) {
                // Remove typing indicator
                this.messagesContainer.removeChild(typingIndicator);
                
                // Render all messages (including the new ones)
                data.messages.forEach(msg => this.renderMessage(msg));
                
                this.loadChats();
            } else {
                // Remove typing indicator
                this.messagesContainer.removeChild(typingIndicator);
                
                // Show error message
                this.renderMessage({
                    role: 'assistant',
                    content: `Error: ${data.error || 'Failed to get response'}`,
                    created_at: new Date().toISOString()
                });
                
                this.showError(data.error || 'Failed to send message');
            }
        } catch (error) {
            // Remove typing indicator
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
            'Delete chat',
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
            
            const data = await response.json();
            
            if (data.success) {
                this.currentChatId = null;
                this.clearMessages();
                this.loadChats();
                if (this.chatHeader) {
                    this.chatHeader.style.display = 'none';
                }
                if (this.deleteChatBtn) {
                    this.deleteChatBtn.style.display = 'none';
                }
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
        if (this.confirmModal) {
            this.confirmModal.classList.remove('active');
        }
        this.confirmAction = null;
    }
    
    closeAllModals() {
        this.closeConfirmModal();
        this.closeSettingsModal();
        this.closeSearchModal();
    }
    
    executeConfirmAction() {
        if (this.confirmAction) {
            this.confirmAction();
        }
    }

    // Settings modal helpers
    showSettingsModal() {
        // load current user settings and populate fields
        this.loadUserSettings().then(settings => {
            const ints = (settings && settings.integrations) || {};
            if (this.intSpotify) this.intSpotify.checked = !!ints.spotify;
            if (this.spotifyEndpoint) this.spotifyEndpoint.value = ints.spotifyEndpoint || '';
            if (this.intHomeAssistant) this.intHomeAssistant.checked = !!ints.homeassistant;
            if (this.homeAssistantEndpoint) this.homeAssistantEndpoint.value = ints.homeAssistantEndpoint || '';
            if (this.intCanva) this.intCanva.checked = !!ints.canva;
            if (this.canvaEndpoint) this.canvaEndpoint.value = ints.canvaEndpoint || '';
            if (this.settingsModal) this.settingsModal.classList.add('active');
        }).catch(() => {
            if (this.settingsModal) this.settingsModal.classList.add('active');
        });
    }

    closeSettingsModal() {
        if (this.settingsModal) this.settingsModal.classList.remove('active');
    }

    async saveSettings() {
        const integrations = {
            spotify: !!(this.intSpotify && this.intSpotify.checked),
            spotifyEndpoint: this.spotifyEndpoint ? this.spotifyEndpoint.value.trim() : '',
            homeassistant: !!(this.intHomeAssistant && this.intHomeAssistant.checked),
            homeAssistantEndpoint: this.homeAssistantEndpoint ? this.homeAssistantEndpoint.value.trim() : '',
            canva: !!(this.intCanva && this.intCanva.checked),
            canvaEndpoint: this.canvaEndpoint ? this.canvaEndpoint.value.trim() : ''
        };
        const payload = { integrations };
        this.showLoading();
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: payload })
            });
            const data = await res.json();
            if (data.success) {
                this.closeSettingsModal();
                this.showError('Settings saved');
            } else {
                this.showError(data.error || 'Failed to save settings');
            }
        } catch (err) {
            this.showError('Failed to save settings');
        } finally {
            this.hideLoading();
        }
    }

    // Web search modal helpers
    showSearchModal() {
        if (this.searchModal) this.searchModal.classList.add('active');
    }

    closeSearchModal() {
        if (this.searchModal) this.searchModal.classList.remove('active');
        if (this.searchResults) this.searchResults.innerHTML = '';
        if (this.searchInput) this.searchInput.value = '';
    }

    async performSearch() {
        const q = this.searchInput ? this.searchInput.value.trim() : '';
        if (!q) return this.showError('Enter a search query');
        if (this.searchResults) this.searchResults.innerHTML = '<div class="example-btn">Searching...</div>';
        try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(q));
            const data = await res.json();
            if (data.success) {
                const items = [];
                if (data.abstract) items.push({ title: data.abstract, url: data.abstractUrl });
                (data.related || []).forEach(r => {
                    if (Array.isArray(r)) r.forEach(i => items.push(i)); else items.push(r);
                });
                this.searchResults.innerHTML = items.map(it => `<div style="margin-bottom:12px"><div style="font-weight:600">${this.escapeHtml(it.text || it.title || '')}</div>${it.url ? `<div style="font-size:12px;color:var(--text-muted)">${this.escapeHtml(it.url)}</div>` : ''}</div>`).join('');
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
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
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
    
    // Example prompts
    useExample(prompt) {
        if (!this.user) {
            window.location.href = '/login';
            return;
        }
        
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
    
    // Utility Functions
    autoResizeTextarea() {
        if (!this.messageInput) return;
        
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
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
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
        }
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('active');
        }
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
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    // Load user settings
    async loadUserSettings() {
        try {
            const res = await fetch('/api/user/settings');
            const data = await res.json();
            if (data.success) return data.settings || {};
            return {};
        } catch (e) {
            return {};
        }
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
}


// Initialize app when DOM is loaded
>>>>>>> origin/main
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ZigApp();
  window.closeConfirmModal = () => window.app.closeConfirmModal();
  window.executeConfirmAction = () => window.app.executeConfirmAction();
});
