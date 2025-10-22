(function (w) {
  const q = (id) => document.getElementById(id);

  function renderMessages(items) {
    const list = q('messagesList');
    if (!list) return;
    list.innerHTML = '';
    for (const m of items) {
      const li = document.createElement('li');
      li.className = 'rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-md p-4 text-sm border border-gray-200 hover:shadow-lg transition-shadow animate-fadeIn';
      li.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-full p-2 text-white flex-shrink-0 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="text-slate-900 whitespace-pre-wrap text-sm sm:text-base">${m.text || ''}</div>
            <div class="text-xs text-slate-500 mt-2 flex items-center font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        </div>
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
