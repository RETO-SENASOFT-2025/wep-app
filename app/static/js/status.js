(function (w) {
  const q = (id) => document.getElementById(id);
  w.SuperAppState = w.SuperAppState || { aiOnline: false, chatSelected: false, processing: false };
  function applyComposerLock() {
  }
  w.applyComposerLock = applyComposerLock;

  function getStatusUrl() {
    return '/api/ai_status';
  }

  function renderAiIndicator(isOnline) {
    const ind = q('aiStatusIndicator');
    if (!ind) return;
    const base = 'rounded-full px-3 py-1 text-xs md:text-sm border';
    ind.className = base + (isOnline ? ' bg-green-100 text-green-700 border-green-200' : ' bg-red-100 text-red-700 border-red-200');
    ind.textContent = isOnline ? 'IA OK' : 'IA caida';
  }

  function updateApiStatus(isOnline) {
    renderAiIndicator(isOnline);
    w.SuperAppState.aiOnline = !!isOnline;
  }

  async function checkStatus() {
    const url = getStatusUrl();
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const data = await resp.json().catch(() => ({}));
      const ok = !!data.ok && resp.ok;
      updateApiStatus(ok);
    } catch (e) {
      updateApiStatus(false);
    }
  }

  function init() {
    checkStatus();
    const RECHECK_MS = 12000;
    w.setInterval(checkStatus, RECHECK_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  w.SuperAppStatus = { checkStatus };
})(window);