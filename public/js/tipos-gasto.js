import { peticion } from './api.js';
import { iniciarAdmin, aviso, escapar, limpiar, estadoBadge } from './crud-utils.js';

iniciarAdmin();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const inputCodigo = document.getElementById('codigotg');

// El código no se puede modificar: se bloquea al editar
const OPCIONES_LIMPIAR = {
  tituloNuevo: 'Registrar tipo de gasto',
  alEditar: (editar) => { inputCodigo.disabled = editar; }
};

let registros = [];

async function cargar() {
  try {
    registros = await peticion('/tipos-gasto');
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filas = registros
    .filter((t) => `${t.codigotg} ${t.descripcion}`.toLowerCase().includes(q))
    .map((t) => `
      <tr>
        <td>${escapar(t.codigotg)}</td>
        <td>${escapar(t.descripcion)}</td>
        <td>${estadoBadge(t.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(t.idtipogasto)}" ${!t.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(t.idtipogasto)}" data-valor="${!t.estado}">
            ${t.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="4">No hay tipos de gasto para mostrar.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  const data = id ? { descripcion } : { codigotg: inputCodigo.value.trim(), descripcion };

  try {
    await peticion(id ? `/tipos-gasto/${encodeURIComponent(id)}` : '/tipos-gasto', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Tipo de gasto actualizado correctamente' : 'Tipo de gasto registrado correctamente');
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
    const t = registros.find((x) => x.idtipogasto === editar.dataset.editar);
    document.getElementById('idregistro').value = t.idtipogasto;
    inputCodigo.value = t.codigotg;
    inputCodigo.disabled = true;
    document.getElementById('descripcion').value = t.descripcion;
    document.getElementById('titulo-form').textContent = 'Editar tipo de gasto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este tipo de gasto?`)) return;

    try {
      await peticion(`/tipos-gasto/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Tipo de gasto ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
