(function (w) {
  const q = (id) => document.getElementById(id);

  function renderMessages(items) {
    const list = q('messagesList');
    if (!list) return;
    list.innerHTML = '';
    for (const m of items) {
      const li = document.createElement('li');
      li.className = 'rounded-md bg-white shadow-sm p-3 text-sm';
      li.innerHTML = `
        <div class="text-slate-900">${m.text || ''}</div>
        <div class="text-xs text-slate-500 mt-1">${new Date(m.created_at).toLocaleString()}</div>
      `;
      list.appendChild(li);
    }
  }

  async function refresh() {
    const activeId = Number(w.localStorage.getItem('activeChatId'));
    if (!activeId) return;
    const items = await w.SuperAppDB.getMessagesByChat(activeId);
    renderMessages(items);
  }

  function bindComposer() {
    const input = q('messageInput');
    const sendBtn = q('sendMessage');
    const clearBtn = q('clearMessages');
    if (!input || !sendBtn) return;

    async function send() {
      const text = input.value.trim();
      const activeId = Number(w.localStorage.getItem('activeChatId'));
      if (!text || !activeId) return;
      await w.SuperAppDB.addMessage(activeId, text);
      input.value = '';
      await refresh();
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
    });
    clearBtn && clearBtn.addEventListener('click', async () => {
      const activeId = Number(w.localStorage.getItem('activeChatId'));
      if (!activeId) return;
      await w.SuperAppDB.deleteMessagesByChat(activeId);
      await refresh();
      w.showToast && w.showToast('Mensajes limpiados');
    });
  }

  function init() {
    bindComposer();
    refresh();
  }

  w.addEventListener('SuperApp:onReady', () => {
    // Solo inicializa si la página tiene el composer
    if (q('messageInput')) init();
  });
  w.SuperAppMessages = { init, refresh };
})(window);
