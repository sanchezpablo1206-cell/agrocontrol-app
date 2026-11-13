import { peticion } from './api.js';
import { API_URL } from './config.js';
import { iniciarAdmin, aviso, escapar, limpiar, estadoBadge, leerImagen, vistaPreviaImagen } from './crud-utils.js';

iniciarAdmin();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const inputCodigo = document.getElementById('codigotc');
const inputImagen = document.getElementById('imagen');
const vistaPrevia = document.getElementById('vista-previa');

// Se agrega ?v= para que el navegador no muestre una imagen vieja en caché
let version = Date.now();
const urlImagen = (id) => `${API_URL}/tipos-cultivo/${encodeURIComponent(id)}/imagen?v=${version}`;

// Al editar: el código se bloquea y la imagen pasa a ser opcional
function modoEdicion(editar) {
  inputCodigo.disabled = editar;
  document.getElementById('ayuda-imagen').textContent = editar ? '(opcional)' : '*';
  if (!editar) vistaPrevia.hidden = true;
}

const OPCIONES_LIMPIAR = { tituloNuevo: 'Registrar tipo de cultivo', alEditar: modoEdicion };

let registros = [];

vistaPreviaImagen(inputImagen, vistaPrevia);

async function cargar() {
  try {
    registros = await peticion('/tipos-cultivo');
    version = Date.now();
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filas = registros
    .filter((t) => `${t.codigotc} ${t.descripcion}`.toLowerCase().includes(q))
    .map((t) => `
      <tr>
        <td><img class="crud-miniatura" src="${urlImagen(t.idtipocultivo)}" alt="${escapar(t.descripcion)}"></td>
        <td>${escapar(t.codigotc)}</td>
        <td>${escapar(t.descripcion)}</td>
        <td>${estadoBadge(t.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(t.idtipocultivo)}" ${!t.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(t.idtipocultivo)}" data-valor="${!t.estado}">
            ${t.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="5">No hay tipos de cultivo para mostrar.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;

  try {
    const imagen = await leerImagen(inputImagen);
    if (!id && !imagen) {
      aviso('La imagen es obligatoria para registrar un tipo de cultivo.', 'error');
      return;
    }

    const data = { descripcion: document.getElementById('descripcion').value.trim() };
    if (!id) data.codigotc = inputCodigo.value.trim();
    if (imagen) data.imagen = imagen;

    await peticion(id ? `/tipos-cultivo/${encodeURIComponent(id)}` : '/tipos-cultivo', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Tipo de cultivo actualizado correctamente' : 'Tipo de cultivo registrado correctamente');
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
    const t = registros.find((x) => x.idtipocultivo === editar.dataset.editar);
    document.getElementById('idregistro').value = t.idtipocultivo;
    inputCodigo.value = t.codigotc;
    document.getElementById('descripcion').value = t.descripcion;
    inputImagen.value = '';
    modoEdicion(true);
    vistaPrevia.src = urlImagen(t.idtipocultivo);
    vistaPrevia.hidden = false;
    document.getElementById('titulo-form').textContent = 'Editar tipo de cultivo';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} este tipo de cultivo?`)) return;

    try {
      await peticion(`/tipos-cultivo/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar });
      aviso(`Tipo de cultivo ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargar();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargar();
