import { getUsuario, cerrarSesion } from './api.js';

const escapar = (v = '') => String(v ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const INICIO = '/pages/home.html';

// Menú agrupado: cada grupo se muestra como un desplegable para que el header
// no se desborde cuando el usuario tiene muchas opciones (administrador).
const GRUPOS = [
  {
    texto: 'Producción',
    icono: '🌾',
    roles: ['admin', 'user'],
    opciones: [
      { texto: 'Mis lotes', url: '/pages/lotes.html', icono: '▦' },
      { texto: 'Cultivos', url: '/pages/cultivos.html', icono: '✿' },
      { texto: 'Gastos', url: '/pages/gastos.html', icono: '$' }
    ]
  },
  {
    texto: 'Catálogos',
    icono: '☰',
    roles: ['admin'],
    opciones: [
      { texto: 'Tipos de cultivo', url: '/pages/tipos-cultivo.html', icono: '❀' },
      { texto: 'Tipos de gasto', url: '/pages/tipos-gasto.html', icono: '☰' }
    ]
  },
  {
    texto: 'Administración',
    icono: '⚙',
    roles: ['admin'],
    opciones: [
      { texto: 'Personas', url: '/pages/personas.html', icono: '♙' },
      { texto: 'Usuarios', url: '/pages/usuarios.html', icono: '♧' },
      { texto: 'Perfiles', url: '/pages/perfiles.html', icono: '▤' }
    ]
  }
];

const enlace = (o, clase = 'nav-link-agro') => `
  <a class="${clase} ${location.pathname === o.url ? 'activo' : ''}" href="${o.url}">
    <span aria-hidden="true">${o.icono}</span>${o.texto}
  </a>`;

const grupoHtml = (g, i) => {
  const activo = g.opciones.some((o) => o.url === location.pathname);
  return `
    <div class="nav-grupo">
      <button class="nav-link-agro nav-desplegar ${activo ? 'activo' : ''}" type="button"
        aria-expanded="false" aria-controls="grupo-${i}">
        <span aria-hidden="true">${g.icono}</span>${g.texto}<span class="flecha" aria-hidden="true">▾</span>
      </button>
      <div class="nav-submenu" id="grupo-${i}">
        ${g.opciones.map((o) => enlace(o, 'nav-subenlace')).join('')}
      </div>
    </div>`;
};

function cerrarGrupos(excepto) {
  document.querySelectorAll('.nav-grupo.abierto').forEach((g) => {
    if (g === excepto) return;
    g.classList.remove('abierto');
    g.querySelector('.nav-desplegar').setAttribute('aria-expanded', 'false');
  });
}

// Botón "Atrás" al inicio de cada sección (todas las páginas excepto Inicio)
function agregarBotonAtras() {
  if (location.pathname === INICIO) return;
  const main = document.querySelector('main');
  if (!main || main.querySelector('.btn-atras')) return;

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-atras';
  boton.innerHTML = '<span aria-hidden="true">←</span> Atrás';
  boton.addEventListener('click', () => {
    // Si se llegó desde otra página de la app se regresa a ella; si no, al inicio
    const desdeLaApp = document.referrer && new URL(document.referrer).origin === location.origin;
    if (desdeLaApp && history.length > 1) history.back();
    else location.href = INICIO;
  });
  main.prepend(boton);
}

export function renderHeader() {
  const usuario = getUsuario();
  const contenedor = document.getElementById('header');
  if (!contenedor || !usuario) return;

  const grupos = GRUPOS.filter((g) => g.roles.includes(usuario.rol)).map(grupoHtml).join('');
  const rol = usuario.rol === 'admin' ? 'Administrador' : 'Productor';

  contenedor.innerHTML = `
    <header class="header-agro">
      <a class="marca" href="${INICIO}" aria-label="AgroControl inicio">
        <span class="marca-icono">🌱</span>
        <span>AgroControl<small>Gestión agrícola</small></span>
      </a>
      <button class="menu-toggle" id="menuToggle" type="button" aria-label="Abrir menú"
        aria-expanded="false" aria-controls="navAgro">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav-agro" id="navAgro" aria-label="Navegación principal">
        <div class="nav-enlaces">
          ${enlace({ texto: 'Inicio', url: INICIO, icono: '⌂' })}
          ${grupos}
        </div>
        <div class="nav-grupo nav-usuario">
          <button class="nav-link-agro nav-desplegar usuario-boton" type="button"
            aria-expanded="false" aria-controls="grupo-usuario">
            <span class="usuario-avatar" aria-hidden="true">${escapar((usuario.nombreu ?? 'U').charAt(0).toUpperCase())}</span>
            <span class="usuario-nombre">${escapar(usuario.nombreu ?? 'Usuario')}<small>${rol}</small></span>
            <span class="flecha" aria-hidden="true">▾</span>
          </button>
          <div class="nav-submenu derecha" id="grupo-usuario">
            ${enlace({ texto: 'Mis datos', url: '/pages/mis-datos.html', icono: '☺' }, 'nav-subenlace')}
            <button class="nav-subenlace salir" id="btnSalir" type="button">
              <span aria-hidden="true">⏻</span>Cerrar sesión
            </button>
          </div>
        </div>
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

  nav.querySelectorAll('.nav-desplegar').forEach((boton) => {
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const grupo = boton.closest('.nav-grupo');
      cerrarGrupos(grupo);
      const abierto = grupo.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', String(abierto));
    });
  });

  // Cerrar desplegables al hacer clic fuera o con Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-grupo')) cerrarGrupos();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarGrupos();
  });

  document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

  agregarBotonAtras();
}
