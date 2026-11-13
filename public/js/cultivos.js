import { peticion } from './api.js';
import { API_URL } from './config.js';
import { iniciarPagina, aviso, escapar, limpiar, hoy, leerImagen, vistaPreviaImagen } from './crud-utils.js';

iniciarPagina();

const REQUERIMIENTOS = ['temp_min', 'temp_max', 'ph_min', 'ph_max', 'agua_semana', 'ciclo_dias'];

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const selLote = document.getElementById('idlote');
const selTipo = document.getElementById('idtipocultivo');
const inputCodigo = document.getElementById('codigoc');
const inputImagen = document.getElementById('imagen');
const vistaPrevia = document.getElementById('vista-previa');
const filtros = {
  idlote: document.getElementById('filtro-lote'),
  idtipocultivo: document.getElementById('filtro-tipo'),
  estado: document.getElementById('filtro-estado')
};
const panelFinalizar = document.getElementById('panel-finalizar');
const formFinalizar = document.getElementById('formFinalizar');

let cultivos = [];
let lotes = [];
let tipos = [];
let idFinalizar = null;
let version = Date.now();

const urlImagen = (id) => `${API_URL}/cultivos/${encodeURIComponent(id)}/imagen?v=${version}`;

const CLASE_ESTADO = { 'En curso': 'activo', Finalizado: 'finalizado', Inactivo: 'inactivo' };
const badgeCultivo = (estado) => `<span class="estado ${CLASE_ESTADO[estado]}">${escapar(estado)}</span>`;

document.getElementById('fecha_siembra').max = hoy();
document.getElementById('fecha_cierre').max = hoy();
vistaPreviaImagen(inputImagen, vistaPrevia);

// En edición: no se cambian el código ni el lote, y la imagen es opcional
function modoEdicion(editar) {
  inputCodigo.disabled = editar;
  selLote.disabled = editar;
  document.getElementById('ayuda-imagen').textContent = editar ? '(opcional)' : '*';
  if (!editar) {
    vistaPrevia.hidden = true;
    llenarSelects();
  }
}

const OPCIONES_LIMPIAR = { tituloNuevo: 'Registrar cultivo', alEditar: modoEdicion };

// ───────────── Listas desplegables ─────────────

// Solo lotes activos; los que ya tienen un cultivo En curso aparecen deshabilitados.
// En edición se agregan el lote y el tipo actuales aunque no estén en la lista.
function llenarSelects(cultivoActual) {
  const listaLotes = [...lotes];
  if (cultivoActual && !listaLotes.some((l) => l.idlote === cultivoActual.idlote)) listaLotes.push(cultivoActual.lote);

  selLote.innerHTML = '<option value="">Selecciona un lote</option>' + listaLotes
    .map((l) => {
      const ocupado = l.cultivos?.length && l.idlote !== cultivoActual?.idlote;
      return `<option value="${escapar(l.idlote)}" ${ocupado ? 'disabled' : ''}>
        ${escapar(l.codigol)} — ${escapar(l.descripcion)}${ocupado ? ' (con cultivo en curso)' : ''}
      </option>`;
    })
    .join('');

  const listaTipos = [...tipos];
  if (cultivoActual && !listaTipos.some((t) => t.idtipocultivo === cultivoActual.idtipocultivo)) {
    listaTipos.push(cultivoActual.tipoCultivo);
  }
  selTipo.innerHTML = '<option value="">Selecciona un tipo</option>' + listaTipos
    .map((t) => `<option value="${escapar(t.idtipocultivo)}">${escapar(t.descripcion)}${t.estado ? '' : ' (inactivo)'}</option>`)
    .join('');
}

function llenarFiltros() {
  const actual = { lote: filtros.idlote.value, tipo: filtros.idtipocultivo.value };
  filtros.idlote.innerHTML = '<option value="">Todos los lotes</option>' + lotes
    .map((l) => `<option value="${escapar(l.idlote)}">${escapar(l.codigol)}</option>`)
    .join('');
  filtros.idtipocultivo.innerHTML = '<option value="">Todos los tipos</option>' + tipos
    .map((t) => `<option value="${escapar(t.idtipocultivo)}">${escapar(t.descripcion)}</option>`)
    .join('');
  filtros.idlote.value = actual.lote;
  filtros.idtipocultivo.value = actual.tipo;
}

// ───────────── Carga y tabla ─────────────

async function cargarListas() {
  try {
    [lotes, tipos] = await Promise.all([peticion('/lotes?activos=true'), peticion('/tipos-cultivo?activos=true')]);
    llenarSelects();
    llenarFiltros();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

async function cargar() {
  try {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, sel]) => sel.value).map(([clave, sel]) => [clave, sel.value])
    );
    cultivos = await peticion(params.toString() ? `/cultivos?${params}` : '/cultivos');
    version = Date.now();
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const filas = cultivos
    .map((c) => {
      const enCurso = c.estado === 'En curso';
      const inactivo = c.estado === 'Inactivo';
      return `
      <tr>
        <td><img class="crud-miniatura" src="${urlImagen(c.idcultivo)}" alt="${escapar(c.nombre)}"></td>
        <td>${escapar(c.codigoc)}</td>
        <td>${escapar(c.nombre)}</td>
        <td>${escapar(c.lote?.codigol || '—')}</td>
        <td>${escapar(c.tipoCultivo?.descripcion || '—')}</td>
        <td>${escapar(c.fecha_siembra)}${c.fecha_cierre ? `<br><small class="text-muted">Cierre: ${escapar(c.fecha_cierre)}</small>` : ''}</td>
        <td>${badgeCultivo(c.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(c.idcultivo)}" ${!enCurso ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla" data-finalizar="${escapar(c.idcultivo)}" ${!enCurso ? 'disabled' : ''}>Finalizar</button>
          <button class="btn-tabla danger" data-estado="${escapar(c.idcultivo)}" data-valor="${inactivo}">
            ${inactivo ? 'Habilitar' : 'Inhabilitar'}
          </button>
        </td>
      </tr>`;
    })
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="8">No hay cultivos para mostrar.</td></tr>';
}

// ───────────── Formulario ─────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;

  try {
    const imagen = await leerImagen(inputImagen);
    if (!id && !imagen) {
      aviso('La imagen es obligatoria para registrar un cultivo.', 'error');
      return;
    }

    const data = {
      idtipocultivo: selTipo.value,
      nombre: document.getElementById('nombre').value.trim(),
      fecha_siembra: document.getElementById('fecha_siembra').value,
      tipo_suelo: document.getElementById('tipo_suelo').value,
      ...Object.fromEntries(REQUERIMIENTOS.map((c) => [c, Number(document.getElementById(c).value)]))
    };
    if (!id) {
      data.idlote = selLote.value;
      data.codigoc = inputCodigo.value.trim();
    }
    if (imagen) data.imagen = imagen;

    if (data.temp_min >= data.temp_max) throw new Error('La temperatura mínima debe ser menor que la máxima');
    if (data.ph_min >= data.ph_max) throw new Error('El pH mínimo debe ser menor que el máximo');

    await peticion(id ? `/cultivos/${encodeURIComponent(id)}` : '/cultivos', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Cultivo actualizado correctamente' : 'Cultivo registrado correctamente (En curso)');
    limpiar(form, OPCIONES_LIMPIAR);
    await cargarListas();
    await cargar();
  } catch (err) {
    aviso(err.message, 'error');
  }
});

document.getElementById('cancelar').addEventListener('click', () => limpiar(form, OPCIONES_LIMPIAR));
Object.values(filtros).forEach((sel) => sel.addEventListener('change', cargar));

// ───────────── Finalizar cultivo ─────────────

function cerrarFinalizar() {
  idFinalizar = null;
  panelFinalizar.hidden = true;
  formFinalizar.reset();
}

formFinalizar.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await peticion(`/cultivos/${encodeURIComponent(idFinalizar)}/finalizar`, 'PATCH', {
      fecha_cierre: document.getElementById('fecha_cierre').value
    });
    aviso('Cultivo finalizado correctamente');
    cerrarFinalizar();
    await cargarListas();
    await cargar();
  } catch (err) {
    aviso(err.message, 'error');
  }
});

document.getElementById('cancelar-finalizar').addEventListener('click', cerrarFinalizar);

// ───────────── Acciones de la tabla ─────────────

tabla.addEventListener('click', async (e) => {
  const editar = e.target.closest('[data-editar]');
  const finalizar = e.target.closest('[data-finalizar]');
  const estado = e.target.closest('[data-estado]');

  if (editar) {
    const c = cultivos.find((x) => x.idcultivo === editar.dataset.editar);
    llenarSelects(c);
    modoEdicion(true);
    document.getElementById('idregistro').value = c.idcultivo;
    selLote.value = c.idlote;
    selTipo.value = c.idtipocultivo;
    inputCodigo.value = c.codigoc;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('fecha_siembra').value = c.fecha_siembra;
    document.getElementById('tipo_suelo').value = c.tipo_suelo;
    REQUERIMIENTOS.forEach((campo) => { document.getElementById(campo).value = Number(c[campo]); });
    inputImagen.value = '';
    vistaPrevia.src = urlImagen(c.idcultivo);
    vistaPrevia.hidden = false;
    document.getElementById('titulo-form').textContent = 'Editar cultivo';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (finalizar) {
    const c = cultivos.find((x) => x.idcultivo === finalizar.dataset.finalizar);
    idFinalizar = c.idcultivo;
    document.getElementById('finalizar-nombre').textContent = `${c.codigoc} — ${c.nombre}`;
    document.getElementById('fecha_cierre').min = c.fecha_siembra;
    document.getElementById('fecha_cierre').value = hoy();
    panelFinalizar.hidden = false;
    panelFinalizar.scrollIntoView({ behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este cultivo?`)) return;

    try {
      const id = encodeURIComponent(estado.dataset.estado);
      await peticion(activar ? `/cultivos/${id}/habilitar` : `/cultivos/${id}`, activar ? 'PATCH' : 'DELETE');
      aviso(`Cultivo ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargarListas();
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargarListas().then(cargar);
