import { peticion } from './api.js';
import { iniciarAdmin, aviso, escapar, limpiar, estadoBadge } from './crud-utils.js';

iniciarAdmin();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const OPCIONES_LIMPIAR = { tituloNuevo: 'Registrar perfil' };

let registros = [];

async function cargar() {
  try {
    registros = await peticion('/perfiles');
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filas = registros
    .filter((p) => p.descripc.toLowerCase().includes(q))
    .map((p) => `
      <tr>
        <td>${escapar(p.descripc)}</td>
        <td>${estadoBadge(p.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(p.idperfil)}" ${!p.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(p.idperfil)}" data-valor="${!p.estado}">
            ${p.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="3">No hay perfiles para mostrar.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;
  const descripc = document.getElementById('descripc').value.trim();

  try {
    await peticion(id ? `/perfiles/${encodeURIComponent(id)}` : '/perfiles', id ? 'PUT' : 'POST', { descripc });
    aviso(id ? 'Perfil actualizado correctamente' : 'Perfil registrado correctamente');
    limpiar(form, OPCIONES_LIMPIAR);
    await cargar();
  } catch (err) {
    aviso(err.message, 'error');
  }
});

document.getElementById('cancelar').addEventListener('click', () => limpiar(form, OPCIONES_LIMPIAR));
buscar.addEventListener('input', pintar);

tabla.addEventListener('click', async (e) => {
  const editar = e.target.closest('[data-editar]');
  const estado = e.target.closest('[data-estado]');

  if (editar) {
    const p = registros.find((x) => x.idperfil === editar.dataset.editar);
    document.getElementById('idregistro').value = p.idperfil;
    document.getElementById('descripc').value = p.descripc;
    document.getElementById('titulo-form').textContent = 'Editar perfil';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este perfil?`)) return;

    try {
      await peticion(`/perfiles/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Perfil ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
