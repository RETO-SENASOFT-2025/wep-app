(function () {
    const w = window;
    const d = document;
    const q = (sel) => d.querySelector(sel.startsWith('#') ? sel : `#${sel}`);

    w.SuperAppState = w.SuperAppState || {
        aiOnline: true,
        chatSelected: false,
        processing: false,
    };

    function getActiveChatId() {
        const id = w.localStorage.getItem('activeChatId');
        return id ? Number(id) : null;
    }

    function updateCharCount() {
        const input = q('messageInput');
        const countEl = q('charCount');
        if (!input || !countEl) return;
        const len = (input.value || '').length;
        countEl.textContent = `${len}/500`;
        countEl.classList.remove('char-counter-warning', 'char-counter-danger');
        if (len > 450 && len <= 500) {
            countEl.classList.add('char-counter-warning');
        } else if (len > 500) {
            countEl.classList.add('char-counter-danger');
        }
    }

    function scrollToBottom() {
        const container = d.querySelector('.flex-1.overflow-y-auto');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function renderMessages(messages) {
        const list = q('messagesList');
        if (!list) return;
        list.innerHTML = '';

        messages.forEach((msg) => {
            const li = d.createElement('li');
            li.className = 'rounded-xl p-4 shadow-sm bg-white border border-gray-100';
            const who = msg.role === 'user' ? 'Tú' : 'Sistema';
            li.innerHTML = `<div class="text-xs text-slate-500 mb-1">${who}</div><div class="text-sm text-slate-800">${msg.text}</div>`;
            list.appendChild(li);
        });

        scrollToBottom();
    }

    async function refresh() {
        const chatId = getActiveChatId();
        const messages = chatId ? await w.SuperAppDB.getMessagesByChat(chatId) : [];

        renderMessages(messages);

        const container = q('composerContainer');
        const hint = q('noChatHint');
        const title = q('activeChatTitle');

        if (!chatId) {
            container && (container.style.display = 'none');
            hint && hint.classList.remove('hidden');
            title && (title.textContent = 'Sin conversación seleccionada');
            w.SuperAppState.chatSelected = false;
        } else {
            container && (container.style.display = '');
            hint && hint.classList.add('hidden');
            try {
                const conv = await w.SuperAppDB.getConversation(chatId);
                title && (title.textContent = conv && conv.title ? conv.title : 'Conversación activa');
            } catch (e) {
                title && (title.textContent = 'Conversación activa');
            }
            w.SuperAppState.chatSelected = true;
        }

        const sendBtn = q('sendMessage');
        const input = q('messageInput');
        if (sendBtn && input) {
            const disabled = w.SuperAppState.processing || !w.SuperAppState.chatSelected;
            sendBtn.disabled = disabled;
            input.disabled = disabled;
        }
    }

    function bindUI() {
        const input = q('messageInput');
        const sendBtn = q('sendMessage');

        input && input.addEventListener('input', updateCharCount);
        input && input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        sendBtn && sendBtn.addEventListener('click', () => {
            sendMessage();
        });

        const clearBtn = q('clearMessages');
        clearBtn && clearBtn.addEventListener('click', async () => {
            const chatId = getActiveChatId();
            if (!chatId) return;
            await w.SuperAppDB.deleteMessagesByChat(chatId);
            await refresh();
        });

        const noChatCreateBtn = q('noChatCreate');
        noChatCreateBtn && noChatCreateBtn.addEventListener('click', async () => {
            await w.SuperAppDB.addConversation('Nueva conversación');
            await refresh();
            w.showToast && w.showToast('Chat creado');
        });
    }

    async function sendMessage() {
        const chatId = getActiveChatId();
        const input = q('messageInput');
        if (!chatId || !input) return;

        const content = input.value.trim();
        if (!content) return;

        await w.SuperAppDB.addMessage(chatId, content, 'user');

        try {
            const conv = await w.SuperAppDB.getConversation(chatId);
            const defaultTitles = ['Nueva conversación', '', null, undefined];
            const needsTitleUpdate = conv && defaultTitles.includes(conv.title);
            if (needsTitleUpdate) {
                await w.SuperAppDB.updateConversation(chatId, { title: content.slice(0, 40) });
            }
        } catch (e) {
            try {
                await w.SuperAppDB.updateConversation(chatId, {});
            } catch (_) { }
        }

        input.value = '';
        updateCharCount();
        await refresh();

        w.SuperAppState.processing = true;

        try {
            const resp = await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, chatId }),
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const reply = (data && data.reply) || 'Sin respuesta';

            await w.SuperAppDB.addMessage(chatId, reply, 'bot');

            await refresh();
        } catch (err) {
            console.error('Error enviando mensaje', err);
        } finally {
            w.SuperAppState.processing = false;
        }
    }

    function init() {
        const input = q('messageInput');
        const sendBtn = q('sendMessage');
        if (input) updateCharCount();

        bindUI();

        refresh();

        const noChatHint = q('noChatHint');
        const composerContainer = q('composerContainer');

        w.addEventListener('SuperApp:activeChatChanged', () => {
            refresh();
        });

        w.addEventListener('SuperApp:onReady', () => {
            const chatId = getActiveChatId();
            if (!chatId) {
                composerContainer && (composerContainer.style.display = 'none');
                noChatHint && noChatHint.classList.remove('hidden');
            }
        });
    }

    w.SuperAppMessages = { refresh, sendMessage };

    if (document.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
