(function (w) {
  const q = (id) => document.getElementById(id);
  const chatList = () => q('chatList');

  function renderChats(chats) {
    const list = chatList();
    if (!list) return;
    list.innerHTML = '';
    const activeId = Number(w.localStorage.getItem('activeChatId')) || null;
    chats.sort((a,b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    for (const chat of chats) {
      const isActive = Number(chat.id) === activeId;
      const li = document.createElement('li');
      li.className = `group flex items-center justify-between rounded-md px-3 py-2 ${isActive ? 'bg-white/30 ring-2 ring-[#7FFFD4]' : 'bg-white/10 hover:bg-white/20'}`;
      li.setAttribute('data-id', String(chat.id));
      if (isActive) li.setAttribute('aria-current', 'true');
      li.innerHTML = `
        <button data-id="${chat.id}" class="select-chat text-left flex-1 min-w-0 ${isActive ? 'font-semibold' : ''}">
          <span class="block text-sm truncate">${chat.title}</span>
        </button>
        <button data-id="${chat.id}" class="delete-chat opacity-70 hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>`;
      list.appendChild(li);
    }
    list.querySelectorAll('.delete-chat').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        await w.SuperAppDB.deleteConversation(id);
        await refresh();
        w.showToast && w.showToast('Chat eliminado');
      });
    });
    list.querySelectorAll('.select-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        w.localStorage.setItem('activeChatId', String(id));
        const title = e.currentTarget.querySelector('span').textContent || 'Conversación';
        const display = document.getElementById('activeChatTitle');
        if (display) display.textContent = title;
        const ev = new CustomEvent('SuperApp:activeChatChanged', { detail: { id, title } });
        w.dispatchEvent(ev);
        refresh();
        w.SuperAppLayout && w.SuperAppLayout.closeSidebar();
      });
    });
  }

  async function refresh() {
    const chats = await w.SuperAppDB.getAllConversations();
    const search = q('chatSearch');
    let filtered = chats;
    if (search && search.value.trim()) {
      const s = search.value.trim().toLowerCase();
      filtered = chats.filter(c => (c.title || '').toLowerCase().includes(s));
    }
    renderChats(filtered);
  }

  async function ensureDefaultChatOnLoad() {
    try {
      if (sessionStorage.getItem('createdBlankChatThisLoad') === 'true') return;
      sessionStorage.setItem('createdBlankChatThisLoad', 'true');
      const newId = await w.SuperAppDB.addConversation('Nueva conversación');
      sessionStorage.setItem('blankChatIdOnLoad', String(newId));
    } catch (e) {}
  }

  function bindUI() {
    const createChatBtn = q('createChat');
    const newChatTitle = q('newChatTitle');
    const newChatQuickBtn = q('newChatQuick');
    const search = q('chatSearch');

    createChatBtn && createChatBtn.addEventListener('click', async () => {
      const title = (newChatTitle && newChatTitle.value.trim()) || '';
      if (!title) return;
      await w.SuperAppDB.addConversation(title);
      newChatTitle.value = '';
      await refresh();
      w.showToast && w.showToast('Chat creado');
    });
    newChatQuickBtn && newChatQuickBtn.addEventListener('click', async () => {
      await w.SuperAppDB.addConversation('Nueva conversación');
      await refresh();
      w.showToast && w.showToast('Chat creado');
    });
    search && search.addEventListener('input', () => { refresh(); });

    w.addEventListener('SuperApp:activeChatChanged', () => { refresh(); });
  }

  async function init() {
    bindUI();
    await ensureDefaultChatOnLoad();
    await refresh();
  }

  w.addEventListener('SuperApp:onReady', init);
  w.SuperAppChats = { init, refresh };
})(window);
