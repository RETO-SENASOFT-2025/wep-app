(function (w) {
  // Configuración del WebSocket
  const wsUrl = 'ws://localhost:8000/ws'; // URL del WebSocket (idealmente desde .env)
  const reconnectInterval = 5000; // Intervalo de reconexión en ms

  let socket = null;
  let isConnected = false;
  let reconnectTimer = null;

  // Elemento de alerta
  const wsAlert = document.getElementById('wsConnectionAlert');
  const statusEl = document.getElementById('wsStatusText');
  const retryBtn = document.getElementById('wsRetryNow');

  function updateStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // Función para mostrar/ocultar la alerta
  function toggleAlert(show) {
    if (!wsAlert) return;
    if (show) {
      wsAlert.classList.remove('hidden');
    } else {
      wsAlert.classList.add('hidden');
    }
  }

  // Iniciar conexión WebSocket
  function connect() {
    if (socket !== null) {
      socket.close();
    }

    try {
      socket = new WebSocket(wsUrl);

      // Eventos del WebSocket
      socket.onopen = function () {
        console.log('Conexión WebSocket establecida');
        isConnected = true;
        updateStatus('Conectado');
        toggleAlert(false);
        clearTimeout(reconnectTimer);
      };

      socket.onclose = function () {
        console.log('Conexión WebSocket cerrada');
        isConnected = false;
        updateStatus('No hay conexión. Reintentaremos en unos segundos…');
        toggleAlert(true);
        // Intentar reconectar
        reconnectTimer = setTimeout(connect, reconnectInterval);
      };

      socket.onerror = function (error) {
        console.error('Error en la conexión WebSocket:', error);
        isConnected = false;
        updateStatus('Error de conexión. Reintentaremos automáticamente…');
        toggleAlert(true);
      };

      socket.onmessage = function (event) {
        // Procesar mensajes recibidos (si es necesario)
        console.log('Mensaje recibido:', event.data);
      };
    } catch (error) {
      console.error('Error al crear la conexión WebSocket:', error);
      isConnected = false;
      updateStatus('No se pudo crear la conexión. Reintentaremos…');
      toggleAlert(true);
      // Intentar reconectar
      reconnectTimer = setTimeout(connect, reconnectInterval);
    }
  }

  // Función para enviar mensajes
  function sendMessage(message) {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Inicializar cuando el DOM esté listo
  function init() {
    // Iniciar conexión
    updateStatus('Conectando…');
    connect();
  }

  // Exponer funciones al objeto global
  w.SuperAppWebSocket = {
    init,
    sendMessage,
    isConnected: () => isConnected
  };

  // Botón de reintento manual
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      updateStatus('Reintentando ahora…');
      connect();
    });
  }

  // Inicializar cuando la aplicación esté lista
  w.addEventListener('SuperApp:onReady', init);

  // Inicializar también al cargar el documento o si ya está listo
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})(window);