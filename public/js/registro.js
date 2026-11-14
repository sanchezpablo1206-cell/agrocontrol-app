import { peticion, getToken } from './api.js';
import { CAMPOS_PERSONA, fechaMaximaNacimiento } from './persona-form.js';

if (getToken()) location.href = '/pages/home.html'; // ya hay sesión

const form = document.getElementById('formRegistro');
const alerta = document.getElementById('alerta');
const selPerfil = document.getElementById('idperfil');
const contrasena = document.getElementById('contrasena');
const confirmar = document.getElementById('confirmar');
const fechaNac = document.getElementById('fecha_nac');
const boton = document.getElementById('btnRegistrar');

fechaNac.max = fechaMaximaNacimiento();

const mostrarError = (texto) => {
  alerta.textContent = texto;
  alerta.classList.remove('d-none');
};

// Perfiles disponibles: el backend ya excluye los de administrador
async function cargarPerfiles() {
  try {
    const perfiles = await peticion('/auth/perfiles-registro');
    if (!perfiles.length) {
      selPerfil.innerHTML = '<option value="">No hay perfiles disponibles</option>';
      mostrarError('Por ahora no hay perfiles disponibles para registrarse. Contacta al administrador.');
      boton.disabled = true;
      return;
    }
    const opciones = perfiles
      .map((p) => {
        const op = document.createElement('option');
        op.value = p.idperfil;
        op.textContent = p.descripc;
        return op;
      });
    selPerfil.replaceChildren(new Option('Selecciona un perfil', ''), ...opciones);
    if (perfiles.length === 1) selPerfil.value = perfiles[0].idperfil;
  } catch (error) {
    mostrarError(error.message);
  }
}

// La confirmación debe coincidir con la contraseña
const validarConfirmacion = () => {
  confirmar.setCustomValidity(confirmar.value === contrasena.value ? '' : 'No coinciden');
};
contrasena.addEventListener('input', validarConfirmacion);
confirmar.addEventListener('input', validarConfirmacion);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alerta.classList.add('d-none');
  validarConfirmacion();
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const datos = {
    documento: document.getElementById('documento').value.trim(),
    ...Object.fromEntries(CAMPOS_PERSONA.map((c) => [c, document.getElementById(c).value.trim() || null])),
    nombreu: document.getElementById('nombreu').value.trim(),
    contrasena: contrasena.value,
    idperfil: selPerfil.value
  };

  boton.disabled = true;
  try {
    const r = await peticion('/auth/registro', 'POST', datos);
    localStorage.setItem('token', r.token);
    localStorage.setItem('usuario', JSON.stringify(r.usuario));
    location.href = '/pages/home.html';
  } catch (error) {
    mostrarError(error.message);
    boton.disabled = false;
  }
});

cargarPerfiles();
