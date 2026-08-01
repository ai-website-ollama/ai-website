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

document.addEventListener('DOMContentLoaded', () => {
  window.app = new ZigApp();
  window.closeConfirmModal = () => window.app.closeConfirmModal();
  window.executeConfirmAction = () => window.app.executeConfirmAction();
});
