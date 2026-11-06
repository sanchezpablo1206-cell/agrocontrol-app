import { peticion } from './api.js';

const token = new URLSearchParams(location.search).get('token');
const alerta = document.getElementById('alerta');

/** RESTABLECER: POST /api/auth/restablecer { token, contrasena } */
document.getElementById('formReset').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.clave2.setCustomValidity(form.clave1.value === form.clave2.value ? '' : 'no coincide');
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    try {
        const r = await peticion('/auth/restablecer', 'POST', { token, contrasena: form.clave1.value });
        alerta.className = 'alert alert-success';
        alerta.textContent = r.mensaje + '. Redirigiendo al login...';
        setTimeout(() => (location.href = '/index.html'), 2000);
    } catch (error) {
        alerta.className = 'alert alert-danger';
        alerta.textContent = error.message;
    }
});