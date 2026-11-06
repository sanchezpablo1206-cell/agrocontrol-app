// URL de la API.
// - Servido por Express (localhost:4000 o Railway): ruta relativa, mismo origen.
// - Abierto con Live Server (otro puerto): apunta al backend local.
const esLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const servidoPorExpress = location.port === '4000' || !esLocal;

export const API_URL = servidoPorExpress
  ? '/api'
  : 'http://localhost:4000/api';