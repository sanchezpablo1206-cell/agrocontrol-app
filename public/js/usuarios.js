import { peticion } from './api.js';
import { iniciarAdmin, aviso, escapar, limpiar, estadoBadge } from './crud-utils.js';

iniciarAdmin();

const form = document.getElementById('formCrud');
const tabla = document.getElementById('tabla');
const buscar = document.getElementById('buscar');
const selPersona = document.getElementById('idpersona');
const selPerfil = document.getElementById('idperfil');
const inputClave = document.getElementById('contrasena');
const ayudaClave = document.getElementById('ayuda-clave');

let usuarios = [];
let personas = [];
let perfiles = [];

const nombre = (p) => [p?.nom1, p?.nom2, p?.apell1, p?.apell2].filter(Boolean).join(' ');

// En edición no se cambia la persona y la contraseña es opcional
function modoEdicion(editar) {
  selPersona.disabled = editar;
  inputClave.required = !editar;
  ayudaClave.textContent = editar ? '(opcional)' : '*';
}

const OPCIONES_LIMPIAR = { tituloNuevo: 'Registrar usuario', alEditar: modoEdicion };

async function cargarListas() {
  try {
    [usuarios, personas, perfiles] = await Promise.all([
      peticion('/usuarios'),
      peticion('/personas'),
      peticion('/perfiles')
    ]);
    llenarSelects();
    pintar();
  } catch (e) {
    aviso(e.message, 'error');
  }
}

function llenarSelects() {
  const personaActual = selPersona.value;
  const perfilActual = selPerfil.value;

  selPersona.innerHTML = '<option value="">Selecciona una persona</option>' + personas
    .filter((p) => p.estado)
    .map((p) => `<option value="${escapar(p.idpersona)}">${escapar(nombre(p))} — ${escapar(p.documento)}</option>`)
    .join('');

  selPerfil.innerHTML = '<option value="">Selecciona un perfil</option>' + perfiles
    .filter((p) => p.estado)
    .map((p) => `<option value="${escapar(p.idperfil)}">${escapar(p.descripc)}</option>`)
    .join('');

  selPersona.value = personaActual;
  selPerfil.value = perfilActual;
}

function pintar() {
  const q = buscar.value.toLowerCase();
  const filas = usuarios
    .filter((u) => `${u.nombreu} ${nombre(u.persona)} ${u.perfil?.descripc} ${u.rol}`.toLowerCase().includes(q))
    .map((u) => `
      <tr>
        <td>${escapar(u.nombreu)}</td>
        <td>${escapar(nombre(u.persona))}</td>
        <td>${escapar(u.perfil?.descripc || '—')}</td>
        <td>${u.rol === 'admin' ? 'Administrador' : 'Usuario'}</td>
        <td>${estadoBadge(u.estado)}</td>
        <td>
          <button class="btn-tabla" data-editar="${escapar(u.idusuario)}" ${!u.estado ? 'disabled' : ''}>Editar</button>
          <button class="btn-tabla danger" data-estado="${escapar(u.idusuario)}" data-valor="${!u.estado}"
            ${u.rol === 'admin' && u.estado ? 'title="Verifica que exista otro administrador"' : ''}>
            ${u.estado ? 'Inhabilitar' : 'Habilitar'}
          </button>
        </td>
      </tr>`)
    .join('');

  tabla.innerHTML = filas || '<tr><td colspan="6">No hay usuarios para mostrar.</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idregistro').value;
  const data = {
    nombreu: document.getElementById('nombreu').value.trim(),
    idpersona: selPersona.value,
    idperfil: selPerfil.value,
    rol: document.getElementById('rol').value
  };

  const clave = inputClave.value;
  if (!id && !clave) {
    aviso('La contraseña es obligatoria para crear un usuario.', 'error');
    return;
  }
  if (clave) data.contrasena = clave;

  try {
    await peticion(id ? `/usuarios/${encodeURIComponent(id)}` : '/usuarios', id ? 'PUT' : 'POST', data);
    aviso(id ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    limpiar(form, OPCIONES_LIMPIAR);
    await cargarListas();
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
    const u = usuarios.find((x) => x.idusuario === editar.dataset.editar);
    document.getElementById('idregistro').value = u.idusuario;
    document.getElementById('nombreu').value = u.nombreu;
    selPersona.value = u.idpersona;
    selPerfil.value = u.idperfil;
    document.getElementById('rol').value = u.rol;
    inputClave.value = '';
    modoEdicion(true);
    document.getElementById('titulo-form').textContent = 'Editar usuario';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (estado) {
    const activar = estado.dataset.valor === 'true';
    const u = usuarios.find((x) => x.idusuario === estado.dataset.estado);
    if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} el usuario ${u?.nombreu}?`)) return;

    try {
      await peticion(`/usuarios/${encodeURIComponent(estado.dataset.estado)}/estado`, 'PATCH', { estado: activar });
      aviso(`Usuario ${activar ? 'habilitado' : 'inhabilitado'} correctamente`);
      await cargarListas();
    } catch (err) {
      aviso(err.message, 'error');
    }
  }
});

cargarListas();
