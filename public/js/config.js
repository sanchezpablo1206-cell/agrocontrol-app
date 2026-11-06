// URL del backend. En local apunta a localhost; en producción, a Render.
const enLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_URL = enLocal
  ? 'http://localhost:4000/api'
  : 'https://TU-BACKEND.onrender.com/api'; // cambia por tu URL real de Render