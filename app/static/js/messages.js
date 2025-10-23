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

  function setActiveChatTitle(title) {
    const el = d.getElementById('activeChatTitle');
    if (el) el.textContent = title || 'Sin conversación seleccionada';
  }

  function updateCharCount() {
    const input = q('messageInput');
    const counter = q('charCount');
    if (!input || !counter) return;
    const len = input.value.length;
    counter.textContent = `${len}/500`;
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
      const who = msg.role === 'user' ? 'Tú' : 'Asistente';
      li.innerHTML = `<div class="text-xs text-slate-500 mb-1">${who}</div><div class="text-sm text-slate-800">${msg.text}</div>`;
      list.appendChild(li);
    });

    scrollToBottom();
  }

  async function refresh() {
    const chatId = getActiveChatId();

    updateComposerVisibility();

    if (!chatId) {
      setActiveChatTitle('Sin conversación seleccionada');
      renderMessages([]);
      w.SuperAppState.chatSelected = false;
      return;
    }

    w.SuperAppState.chatSelected = true;

    // Cargar mensajes de IndexedDB
    try {
      const messages = await w.SuperAppDB.getMessagesByChat(chatId);
      renderMessages(messages || []);
    } catch (err) {
      console.error('Error al cargar mensajes', err);
      renderMessages([]);
    }
  }

  function updateComposerVisibility() {
    const hasChat = !!getActiveChatId();
    const comp = q('composerContainer');
    const hint = q('noChatHint');
    if (comp) comp.classList.toggle('hidden', !hasChat);
    if (hint) hint.classList.toggle('hidden', hasChat);
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
      try { await w.SuperAppDB.updateConversation(chatId, {}); } catch (_) {}
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

  function bindEvents() {
    const input = q('messageInput');
    const sendBtn = q('sendMessage');
    const clearBtn = q('clearMessages');
    const createBtn = q('noChatCreate');

    if (input) {
      input.addEventListener('input', updateCharCount);
      input.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        const chatId = getActiveChatId();
        if (!chatId) return;
        await w.SuperAppDB.deleteMessagesByChat(chatId);
        await refresh();
      });
    }

    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        try {
          const newId = await w.SuperAppDB.addConversation('Nueva conversación');
          w.localStorage.setItem('activeChatId', String(newId));
          setActiveChatTitle('Nueva conversación');
          updateComposerVisibility();
          w.SuperAppChats && w.SuperAppChats.refresh && w.SuperAppChats.refresh();
          w.dispatchEvent(new CustomEvent('SuperApp:activeChatChanged', { detail: { id: Number(newId), title: 'Nueva conversación' } }));
          await refresh();
        } catch (err) {
          console.error('No se pudo crear la conversación', err);
        }
      });
    }

    w.addEventListener('SuperApp:activeChatChanged', async (ev) => {
      const { id, title } = (ev && ev.detail) || {};
      if (id) {
        w.localStorage.setItem('activeChatId', String(id));
        setActiveChatTitle(title || 'Conversación');
      } else {
        w.localStorage.removeItem('activeChatId');
        setActiveChatTitle('Sin conversación seleccionada');
      }
      updateComposerVisibility();
      await refresh();
    });

    w.addEventListener('SuperApp:onReady', async () => {
      updateComposerVisibility();
      updateCharCount();
      await refresh();
    });
  }

  bindEvents();
})();