// ============================================================
// PlanFlow – API Client Layer (api.js)
// Kết nối frontend với Google Apps Script Web App
// ============================================================

const API = (() => {
  // URL mặc định đã được deploy sẵn (Google Sheet của dự án)
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyKcLYteGKoRQyahEbfZHVyRRpqIGEbsMmjQJ0VsIhgjNDxZaG5lGjlML9VSZ6ilqZU/exec';
  const CONFIG_KEY = 'planflow_gas_url';

  // ---- Cấu hình URL ----
  function getUrl() {
    return localStorage.getItem(CONFIG_KEY) || DEFAULT_GAS_URL;
  }
  function setUrl(url)    { localStorage.setItem(CONFIG_KEY, url.trim()); }
  function clearUrl()     { localStorage.removeItem(CONFIG_KEY); }
  function isConfigured() { return true; } // Luôn true vì có DEFAULT_GAS_URL

  // ---- POST request (Content-Type: text/plain để tránh CORS preflight) ----
  async function call(action, payload = {}) {
    const url  = getUrl();
    const body = JSON.stringify({ action, ...payload });

    const res = await fetch(url, {
      method:  'POST',
      mode:    'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  }

  return {
    getUrl, setUrl, clearUrl, isConfigured,

    // Test kết nối & khởi tạo Sheets (dùng GET vì chỉ đọc)
    async setup(url) {
      if (url) setUrl(url);
      const gasUrl = getUrl();
      const res    = await fetch(`${gasUrl}?action=setup`, { mode: 'cors' });
      const json   = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },

    // Ping test
    async ping() {
      const gasUrl = getUrl();
      const res    = await fetch(`${gasUrl}?action=ping`, { mode: 'cors' });
      return await res.json();
    },

    // Lấy toàn bộ dữ liệu
    async getAll() {
      return await call('getAll');
    },

    // Projects
    async saveProject(data)   { return await call('saveProject',   { data }); },
    async deleteProject(id)   { return await call('deleteProject', { id  }); },

    // Tasks
    async saveTask(data)      { return await call('saveTask',      { data }); },
    async deleteTask(id)      { return await call('deleteTask',    { id  }); },
  };
})();
