import { peticion } from './api.js';
import { iniciarAdmin, aviso, escapar, limpiar, estadoBadge } from './crud-utils.js';
import { CAMPOS_PERSONA, fechaMaximaNacimiento, leerPersona, nombreCompleto } from './persona-form.js';

iniciarAdmin();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const OPCIONES_LIMPIAR = { tituloNuevo: 'Registrar persona' };

let registros = [];
let esperaBusqueda;

document.getElementById('fecha_nac').max = fechaMaximaNacimiento();

// La búsqueda por documento, nombre o apellido se hace en el servidor
async function cargar() {
  try {
    const q = buscar.value.trim();
    registros = await peticion(q ? `/personas?q=${encodeURIComponent(q)}` : '/personas');
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const filas = registros
    .map((p) => `
      <tr>
        <td>${escapar(p.documento)}</td>
        <td>${escapar(nombreCompleto(p))}</td>
        <td>${escapar(p.movil || '—')}</td>
        <td>${escapar(p.correo || '—')}</td>
        <td>${Number(p.numLotes) || 0}</td>
        <td>${estadoBadge(p.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(p.idpersona)}" ${!p.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(p.idpersona)}" data-valor="${!p.estado}">
            ${p.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="7">No hay personas que coincidan.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;

  try {
    await peticion(id ? `/personas/${encodeURIComponent(id)}` : '/personas', id ? 'PUT' : 'POST', leerPersona());
    aviso(id ? 'Persona actualizada correctamente' : 'Persona registrada correctamente');
    limpiar(form, OPCIONES_LIMPIAR);
    await cargar();
  } catch (err) {
    aviso(err.message, 'error');
  }
});

document.getElementById('cancelar').addEventListener('click', () => limpiar(form, OPCIONES_LIMPIAR));

buscar.addEventListener('input', () => {
  clearTimeout(esperaBusqueda);
  esperaBusqueda = setTimeout(cargar, 300);
});

tabla.addEventListener('click', async (e) => {
  const editar = e.target.closest('[data-editar]');
  const estado = e.target.closest('[data-estado]');

  if (editar) {
    const p = registros.find((x) => x.idpersona === editar.dataset.editar);
    if (!p) return;
    document.getElementById('idregistro').value = p.idpersona;
    ['documento', ...CAMPOS_PERSONA].forEach((c) => {
      document.getElementById(c).value = p[c] ?? '';
    });
    document.getElementById('titulo-form').textContent = 'Editar persona';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} esta persona?`)) return;

    try {
      await peticion(`/personas/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Persona ${activar ? 'habilitada' : 'inhabilitada'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
