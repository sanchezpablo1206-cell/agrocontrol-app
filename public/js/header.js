import { getUsuario, cerrarSesion } from './api.js';

const escapar = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const OPCIONES = [
  { texto: 'Inicio', url: '/pages/home.html', icono: '⌂', roles: ['admin', 'user'] },
  { texto: 'Personas', url: '/pages/personas.html', icono: '♙', roles: ['admin'] },
  { texto: 'Perfiles', url: '/pages/perfiles.html', icono: '▤', roles: ['admin'] },
  { texto: 'Usuarios', url: '/pages/usuarios.html', icono: '♧', roles: ['admin'] },
  { texto: 'Tipos de gasto', url: '/pages/tipos-gasto.html', icono: '☰', roles: ['admin'] },
  { texto: 'Tipos de cultivo', url: '/pages/tipos-cultivo.html', icono: '❀', roles: ['admin'] },
  { texto: 'Mis lotes', url: '/pages/lotes.html', icono: '▦', roles: ['admin', 'user'] },
  { texto: 'Cultivos', url: '/pages/cultivos.html', icono: '✿', roles: ['admin', 'user'] },
  { texto: 'Gastos', url: '/pages/gastos.html', icono: '$', roles: ['admin', 'user'] },
  { texto: 'Mis datos', url: '/pages/mis-datos.html', icono: '☺', roles: ['admin', 'user'] }
];

export function renderHeader() {
  const usuario = getUsuario();
  const contenedor = document.getElementById('header');
  if (!contenedor || !usuario) return;

  const items = OPCIONES.filter(o => o.roles.includes(usuario.rol)).map(o =>
    `<a class="nav-link-agro ${location.pathname === o.url ? 'activo' : ''}" href="${o.url}"><span aria-hidden="true">${o.icono}</span>${o.texto}</a>`
  ).join('');

  contenedor.innerHTML = `
    <header class="header-agro">
      <a class="marca" href="/pages/home.html" aria-label="AgroControl inicio"><span class="marca-icono">🌱</span><span>AgroControl<small>Gestión agrícola</small></span></a>
      <button class="menu-toggle" id="menuToggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="navAgro"><span></span><span></span><span></span></button>
      <nav class="nav-agro" id="navAgro" aria-label="Navegación principal">
        <div class="nav-enlaces">${items}</div>
        <div class="nav-usuario"><span class="usuario-nombre">${escapar(usuario.nombreu ?? 'Usuario')} <small>${usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</small></span><button class="nav-link-agro salir" id="btnSalir" type="button">Cerrar sesión</button></div>
      </nav>
    </header>`;

  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('navAgro');
  toggle.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    toggle.classList.toggle('activo', abierto);
    toggle.setAttribute('aria-expanded', String(abierto));
    toggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  document.getElementById('btnSalir').addEventListener('click', cerrarSesion);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('abierto')));
}
