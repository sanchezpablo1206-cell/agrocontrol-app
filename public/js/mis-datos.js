import { peticion } from './api.js';
import { iniciarPagina, aviso } from './crud-utils.js';
import { CAMPOS_PERSONA, fechaMaximaNacimiento, leerPersona } from './persona-form.js';

iniciarPagina();

const form = document.getElementById('formCrud');
document.getElementById('fecha_nac').max = fechaMaximaNacimiento();

function mostrar(persona) {
  document.getElementById('ver-documento').value = persona.documento;
  document.getElementById('ver-estado').value = persona.estado ? 'Activo' : 'Inactivo';
  CAMPOS_PERSONA.forEach((c) => {
    document.getElementById(c).value = persona[c] ?? '';
  });
}

async function cargar() {
  try {
    mostrar(await peticion('/personas/mi-perfil'));
  } catch (e) {
    aviso(e.message, 'error');
  }
}

// Solo se envían los campos editables: el documento y el estado no
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    mostrar(await peticion('/personas/mi-perfil', 'PUT', leerPersona()));
    aviso('Tus datos se actualizaron correctamente');
  } catch (err) {
    aviso(err.message, 'error');
  }
});

cargar();
