import { peticion } from './api.js';
import {
  iniciarPagina, aviso, escapar, limpiar, estadoBadge, hoy,
  activarCamposDinero, leerDinero, ponerDinero, formatearPesos
} from './crud-utils.js';

iniciarPagina();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const selCultivo = document.getElementById('idcultivo');
const selTipo = document.getElementById('idtipogasto');
const inputMonto = document.getElementById('monto');
const inputFecha = document.getElementById('fecha');

let gastos = [];
let tipos = [];
let cultivos = [];

activarCamposDinero(form);
inputFecha.value = hoy();

const OPCIONES_LIMPIAR = {
  tituloNuevo: 'Registrar gasto',
  alEditar: () => {
    llenarSelects();
    inputFecha.value = hoy();
  }
};

const textoCultivo = (c) => (c ? `${c.codigoc} — ${c.nombre}${c.lote ? ` (${c.lote.codigol})` : ''}` : '—');

// Solo se listan cultivos En curso y tipos activos. Si el gasto que se edita tiene
// un cultivo finalizado o un tipo inhabilitado, se agrega a la lista para conservarlo.
function llenarSelects(gastoActual) {
  const listaCultivos = [...cultivos];
  if (gastoActual?.cultivo && !listaCultivos.some((c) => c.idcultivo === gastoActual.idcultivo)) {
    listaCultivos.push(gastoActual.cultivo);
  }
  selCultivo.innerHTML = '<option value="">Selecciona un cultivo</option>' + listaCultivos
    .map((c) => `<option value="${escapar(c.idcultivo)}">${escapar(textoCultivo(c))}</option>`)
    .join('');

  const listaTipos = [...tipos];
  if (gastoActual?.tipoGasto && !listaTipos.some((t) => t.idtipogasto === gastoActual.idtipogasto)) {
    listaTipos.push(gastoActual.tipoGasto);
  }
  selTipo.innerHTML = '<option value="">Selecciona un tipo</option>' + listaTipos
    .map((t) => `<option value="${escapar(t.idtipogasto)}">
      ${escapar(t.codigotg)} — ${escapar(t.descripcion)}${t.estado ? '' : ' (inactivo)'}
    </option>`)
    .join('');
}

async function cargar() {
  try {
    [gastos, tipos, cultivos] = await Promise.all([
      peticion('/gastos'),
      peticion('/tipos-gasto?activos=true'),
      peticion(`/cultivos?estado=${encodeURIComponent('En curso')}`)
    ]);
    llenarSelects();
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filtrados = gastos.filter((g) =>
    `${g.fecha} ${textoCultivo(g.cultivo)} ${g.tipoGasto?.descripcion} ${g.descripcion ?? ''} ${g.usuario?.nombreu}`
      .toLowerCase()
      .includes(q)
  );

  const total = filtrados.filter((g) => g.estado).reduce((suma, g) => suma + Number(g.monto), 0);
  document.getElementById('total').textContent = `— Total activos: ${formatearPesos(total)}`;

  const filas = filtrados
    .map((g) => `
      <tr>
        <td>${escapar(g.fecha)}</td>
        <td>${escapar(textoCultivo(g.cultivo))}</td>
        <td>${escapar(g.tipoGasto?.descripcion || '—')}</td>
        <td>${escapar(g.descripcion || '—')}</td>
        <td>${formatearPesos(g.monto)}</td>
        <td>${escapar(g.usuario?.nombreu || '—')}</td>
        <td>${estadoBadge(g.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(g.idgasto)}" ${!g.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(g.idgasto)}" data-valor="${!g.estado}">
            ${g.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="8">No hay gastos para mostrar.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;

  const monto = leerDinero(inputMonto);
  if (!(monto > 0)) {
    aviso('El monto debe ser mayor a 0', 'error');
    return;
  }

  const data = {
    idcultivo: selCultivo.value,
    idtipogasto: selTipo.value,
    monto,
    fecha: inputFecha.value,
    descripcion: document.getElementById('descripcion').value.trim()
  };

  try {
    await peticion(id ? `/gastos/${encodeURIComponent(id)}` : '/gastos', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Gasto actualizado correctamente' : 'Gasto registrado correctamente');
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
    const g = gastos.find((x) => x.idgasto === editar.dataset.editar);
    llenarSelects(g);
    document.getElementById('idregistro').value = g.idgasto;
    selCultivo.value = g.idcultivo;
    selTipo.value = g.idtipogasto;
    ponerDinero(inputMonto, g.monto);
    inputFecha.value = g.fecha;
    document.getElementById('descripcion').value = g.descripcion ?? '';
    document.getElementById('titulo-form').textContent = 'Editar gasto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este gasto?`)) return;

    try {
      await peticion(`/gastos/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Gasto ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
