import { peticion } from './api.js';
import { iniciarPagina, aviso, escapar, limpiar, estadoBadge } from './crud-utils.js';

const usuario = iniciarPagina();
const esAdmin = usuario?.rol === 'admin';

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const inputCodigo = document.getElementById('codigol');

// La columna "Productor" solo tiene sentido para el administrador
document.querySelectorAll('.solo-admin').forEach((el) => { el.hidden = !esAdmin; });

const OPCIONES_LIMPIAR = {
  tituloNuevo: 'Registrar lote',
  alEditar: (editar) => { inputCodigo.disabled = editar; }
};

let registros = [];

const cultivoEnCurso = (l) => l.cultivos?.[0];

async function cargar() {
  try {
    registros = await peticion('/lotes');
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filas = registros
    .filter((l) => `${l.codigol} ${l.descripcion} ${l.clima} ${cultivoEnCurso(l)?.nombre ?? ''}`.toLowerCase().includes(q))
    .map((l) => {
      const cultivo = cultivoEnCurso(l);
      return `
      <tr>
        <td>${escapar(l.codigol)}</td>
        <td>${escapar(l.descripcion)}</td>
        <td>${Number(l.area).toLocaleString('es-CO')}</td>
        <td>${escapar(l.clima)}</td>
        <td>${cultivo ? escapar(`${cultivo.codigoc} — ${cultivo.nombre}`) : '—'}</td>
        ${esAdmin ? `<td>${escapar(l.usuario?.nombreu || '—')}</td>` : ''}
        <td>${estadoBadge(l.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(l.idlote)}" ${!l.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(l.idlote)}" data-valor="${!l.estado}"
            ${l.estado && cultivo ? 'disabled title="Tiene un cultivo En curso"' : ''}>
            ${l.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`;
    })
    .join('');

  tabla.innerHTML = filas || `<tr><td colspan="${esAdmin ? 8 : 7}">No hay lotes para mostrar.</td></tr>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;
  const data = {
    descripcion: document.getElementById('descripcion').value.trim(),
    area: Number(document.getElementById('area').value),
    clima: document.getElementById('clima').value
  };
  if (!id) data.codigol = inputCodigo.value.trim();

  try {
    await peticion(id ? `/lotes/${encodeURIComponent(id)}` : '/lotes', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Lote actualizado correctamente' : 'Lote registrado correctamente');
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
    const l = registros.find((x) => x.idlote === editar.dataset.editar);
    document.getElementById('idregistro').value = l.idlote;
    inputCodigo.value = l.codigol;
    inputCodigo.disabled = true;
    document.getElementById('descripcion').value = l.descripcion;
    document.getElementById('area').value = Number(l.area);
    document.getElementById('clima').value = l.clima;
    document.getElementById('titulo-form').textContent = 'Editar lote';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este lote?`)) return;

    try {
      await peticion(`/lotes/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Lote ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
