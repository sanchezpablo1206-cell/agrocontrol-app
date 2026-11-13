import { protegerPagina, getUsuario } from './api.js';
import { renderHeader } from './header.js';

// Página solo para administradores
export function iniciarAdmin() {
  protegerPagina();
  const usuario = getUsuario();
  if (!usuario || usuario.rol !== 'admin') {
    window.location.replace('/pages/home.html');
    throw new Error('Acceso restringido a administradores');
  }
  renderHeader();
}

// Página para cualquier usuario con sesión
export function iniciarPagina() {
  protegerPagina();
  renderHeader();
  return getUsuario();
}

export function aviso(mensaje, tipo = 'ok') {
  const el = document.getElementById('alerta');
  el.textContent = mensaje;
  el.className = `crud-alerta visible ${tipo}`;
  if (tipo === 'ok') setTimeout(() => el.classList.remove('visible'), 3500);
}

export const escapar = (v = '') =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

export function limpiar(form, campos) {
  form.reset();
  document.getElementById('idregistro').value = '';
  document.getElementById('titulo-form').textContent = campos.tituloNuevo;
  if (campos.alEditar) campos.alEditar(false);
}

export const estadoBadge = (activo, texto = activo ? 'Activo' : 'Inactivo') =>
  `<span class="estado ${activo ? 'activo' : 'inactivo'}">${escapar(texto)}</span>`;

export const hoy = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local

// ───────────── Campos de dinero con punto de mil ─────────────
// Uso: <input data-dinero inputmode="decimal">  →  1.250.000,50

export const formatearDinero = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });

export const formatearPesos = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

// Convierte el texto "1.250.000,50" en el número 1250000.5
export const leerDinero = (input) => {
  const limpio = input.value.replace(/\./g, '').replace(',', '.');
  return limpio === '' ? NaN : Number(limpio);
};

export const ponerDinero = (input, valor) => {
  input.value = valor === null || valor === undefined || valor === '' ? '' : formatearDinero(valor);
};

function darFormatoMientrasEscribe(e) {
  const input = e.target;
  const digitosAntes = input.value.slice(0, input.selectionStart).replace(/[^\d,]/g, '').length;

  // Solo dígitos y una coma decimal (máximo 2 decimales)
  let [entero, ...resto] = input.value.replace(/[^\d,]/g, '').split(',');
  entero = entero.replace(/^0+(?=\d)/, '');
  const decimales = resto.length ? `,${resto.join('').slice(0, 2)}` : '';
  input.value = (entero ? Number(entero).toLocaleString('es-CO') : resto.length ? '0' : '') + decimales;

  // Mantiene el cursor en la misma posición respecto a los dígitos escritos
  let posicion = 0;
  for (let contados = 0; posicion < input.value.length && contados < digitosAntes; posicion++) {
    if (/[\d,]/.test(input.value[posicion])) contados++;
  }
  input.setSelectionRange(posicion, posicion);
}

export function activarCamposDinero(raiz = document) {
  raiz.querySelectorAll('[data-dinero]').forEach((input) => {
    input.addEventListener('input', darFormatoMientrasEscribe);
  });
}

// ───────────── Imágenes (JPG/PNG, máximo 2 MB) ─────────────

const TIPOS_IMAGEN = ['image/jpeg', 'image/png'];
const MAX_IMAGEN = 2 * 1024 * 1024;

// Devuelve la imagen como data URL para enviarla en el JSON, o null si no se eligió archivo
export function leerImagen(input) {
  const archivo = input.files[0];
  if (!archivo) return Promise.resolve(null);
  if (!TIPOS_IMAGEN.includes(archivo.type)) return Promise.reject(new Error('La imagen debe ser JPG o PNG'));
  if (archivo.size > MAX_IMAGEN) return Promise.reject(new Error('La imagen no puede pesar más de 2 MB'));

  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'));
    lector.readAsDataURL(archivo);
  });
}

// Muestra una vista previa del archivo elegido en un <img>
export function vistaPreviaImagen(input, img) {
  input.addEventListener('change', () => {
    const archivo = input.files[0];
    img.hidden = !archivo;
    if (archivo) img.src = URL.createObjectURL(archivo);
  });
}
