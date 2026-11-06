import { peticion, protegerPagina, getUsuario } from './api.js';
import { renderHeader } from './header.js';

export function iniciarAdmin() {
  protegerPagina();
  const usuario = getUsuario();
  if (!usuario || usuario.rol !== 'admin') {
    window.location.replace('/pages/home.html');
    throw new Error('Acceso restringido a administradores');
  }
  renderHeader();
}
export function aviso(mensaje, tipo = 'ok') {
  const el = document.getElementById('alerta');
  el.textContent = mensaje;
  el.className = `crud-alerta visible ${tipo}`;
  if (tipo === 'ok') setTimeout(() => el.classList.remove('visible'), 3500);
}
export const escapar = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function limpiar(form, campos) {
  form.reset();
  document.getElementById('idregistro').value = '';
  document.getElementById('titulo-form').textContent = campos.tituloNuevo;
  if (campos.alEditar) campos.alEditar(false);
}
