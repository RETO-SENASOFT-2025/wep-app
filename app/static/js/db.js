(function (w) {
  const SuperAppDB = {
    db: null,
    openDB() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('SuperAppDB', 2);
        req.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('conversations')) {
            const store = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
            store.createIndex('title', 'title', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
          }
          if (!db.objectStoreNames.contains('messages')) {
            const m = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
            m.createIndex('conversation_id', 'conversation_id', { unique: false });
            m.createIndex('created_at', 'created_at', { unique: false });
          }
        };
        req.onsuccess = (e) => { SuperAppDB.db = e.target.result; resolve(SuperAppDB.db); };
        req.onerror = (e) => reject(e.target.error);
      });
    },
    tx(storeName, mode = 'readonly') {
      return this.db.transaction(storeName, mode).objectStore(storeName);
    },
    getAllConversations() {
      return new Promise((resolve, reject) => {
        const req = this.tx('conversations').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },
    addConversation(title) {
      return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        const req = this.tx('conversations', 'readwrite').add({ title: title || 'Nueva conversación', created_at: now, updated_at: now });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    updateConversation(id, patch) {
      return new Promise(async (resolve, reject) => {
        try {
          const store = this.tx('conversations', 'readwrite');
          const getReq = store.get(id);
          getReq.onsuccess = () => {
            const item = getReq.result;
            if (!item) return reject(new Error('Conversación no encontrada'));
            const now = new Date().toISOString();
            const updated = { ...item, ...patch, updated_at: now };
            const putReq = store.put(updated);
            putReq.onsuccess = () => resolve(updated);
            putReq.onerror = () => reject(putReq.error);
          };
          getReq.onerror = () => reject(getReq.error);
        } catch (e) { reject(e); }
      });
    },
    deleteConversation(id) {
      return new Promise((resolve, reject) => {
        const req = this.tx('conversations', 'readwrite').delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    },
    getMessagesByChat(chatId) {
      return new Promise((resolve, reject) => {
        const idx = this.tx('messages').index('conversation_id');
        const range = IDBKeyRange.only(Number(chatId));
        const results = [];
        const cursorReq = idx.openCursor(range);
        cursorReq.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) { results.push(cursor.value); cursor.continue(); } else { resolve(results.sort((a,b)=> (a.created_at||'').localeCompare(b.created_at||''))); }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    },
    addMessage(chatId, text, role = 'user') {
      return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        const req = this.tx('messages', 'readwrite').add({ conversation_id: Number(chatId), text, role, created_at: now });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    deleteMessagesByChat(chatId) {
      return new Promise((resolve, reject) => {
        const store = this.tx('messages', 'readwrite');
        const idx = store.index('conversation_id');
        const range = IDBKeyRange.only(Number(chatId));
        const cursorReq = idx.openCursor(range);
        cursorReq.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); } else { resolve(); }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    },
    getConversation(id) {
      return new Promise((resolve, reject) => {
        const req = this.tx('conversations').get(Number(id));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },
  };
  w.SuperAppDB = SuperAppDB;
})(window);
