(function (w) {
  const q = (id) => document.getElementById(id);
  function getStatusUrl() {
    const meta = document.querySelector('meta[name="app-status-url"]');
    return (meta && meta.content) || '/status';
  }

  function setComposerDisabled(disabled) {
    const input = q('messageInput');
    const send = q('sendMessage');
    [input, send].forEach((el) => {
      if (!el) return;
      el.disabled = disabled;
      el.classList.toggle('opacity-50', disabled);
      el.classList.toggle('cursor-not-allowed', disabled);
    });
  }

  function updateApiStatus(isOnline) {
    const alert = q('apiStatusAlert');
    if (!alert) return;
    if (isOnline) {
      alert.classList.add('hidden');
      setComposerDisabled(false);
    } else {
      alert.classList.remove('hidden');
      setComposerDisabled(true);
    }
  }

  async function checkStatus() {
    const url = getStatusUrl();
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const text = await resp.text();
      const ok = resp.ok && String(text || '').trim().toLowerCase() === 'on';
      updateApiStatus(ok);
    } catch (e) {
      updateApiStatus(false);
    }
  }

  function init() {
    // Botón de reintento manual si existe
    const retry = document.getElementById('apiRetryNow');
    retry && retry.addEventListener('click', checkStatus);
    checkStatus();
    // Reverifica cada 12s para desbloquear si vuelve a estar online
    w.setInterval(checkStatus, 12000);
  }

  // Inicia cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  w.SuperAppStatus = { checkStatus };
})(window);
