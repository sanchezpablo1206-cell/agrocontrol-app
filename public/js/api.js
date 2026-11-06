// Cliente HTTP compartido. Todas las páginas llaman al backend a través de aquí.
import { API_URL } from './config.js';
const API = API_URL;

export const getToken = () => localStorage.getItem('token');
export const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || 'null');

/**
 * Hace una petición a la API.
 * @param {string} ruta   Ej: '/usuarios'
 * @param {string} metodo GET | POST | PUT | PATCH | DELETE
 * @param {object} cuerpo Datos a enviar (opcional)
 * @returns {Promise<any>} JSON de la respuesta. Lanza Error con el mensaje del backend si falla.
 */
export async function peticion(ruta, metodo = 'GET', cuerpo) {
    const res = await fetch(API + ruta, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() && { Authorization: `Bearer ${getToken()}` })
        },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    const datos = await res.json().catch(() => ({}));

    // Sesión vencida o usuario inhabilitado: se cierra sesión
    if ((res.status === 401 || res.status === 403) && getToken() && !ruta.startsWith('/auth/login')) {
        if (datos.mensaje?.includes('inhabilitado') || res.status === 401) cerrarSesion();
    }
    if (!res.ok) throw new Error(Array.isArray(datos.mensaje) ? datos.mensaje.join(', ') : datos.mensaje || 'Error en la petición');
    return datos;
}

export function cerrarSesion() {
    localStorage.clear();
    window.location.href = '/index.html';
}

// Llamar al inicio de cada página privada
export function protegerPagina() {
    if (!getToken()) window.location.href = '/index.html';
}