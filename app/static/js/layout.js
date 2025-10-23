(function (w) {
  function showToast(message, type = 'info') {
    let el = document.getElementById('appToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'appToast';
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-md shadow-lg z-50';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove('hidden');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 1800);
    setTimeout(() => { el.classList.add('hidden'); }, 2200);
  }

  function bindDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    if (!sidebar || !overlay) return;
    function openSidebar() { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); }
    function closeSidebar() { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); }
    toggleSidebarBtn && toggleSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn && closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    w.SuperAppLayout = { openSidebar, closeSidebar };
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Restablecer selección de chat en cada recarga
    try { localStorage.removeItem('activeChatId'); } catch (e) {}

    bindDrawer();
    w.SuperAppDB.openDB().then((db) => {
      w.db = db; // compat
      const ready = new CustomEvent('SuperApp:onReady');
      w.dispatchEvent(ready);
    }).catch(() => { });
  });

  w.showToast = showToast;
})(window);