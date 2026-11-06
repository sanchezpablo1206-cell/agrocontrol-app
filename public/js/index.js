import { peticion, getToken } from './api.js';

if (getToken()) location.href = '/pages/home.html'; // ya hay sesión

const mostrar = (el, texto, tipo) => { el.textContent = texto; el.className = `alert alert-${tipo} mt-3`; };

/** LOGIN: POST /api/auth/login */
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const alerta = document.getElementById('alerta');
    try {
        const datos = await peticion('/auth/login', 'POST', {
            nombreu: form.nombreu.value.trim(),
            contrasena: form.contrasena.value
        });
        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));
        location.href = '/pages/home.html';
    } catch (error) {
        alerta.textContent = error.message;
        alerta.classList.remove('d-none');
    }
});

/** RECUPERAR CONTRASEÑA: POST /api/auth/recuperar (envía el correo con el enlace) */
document.getElementById('formRecuperar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const alerta = document.getElementById('alertaRec');
    try {
        const r = await peticion('/auth/recuperar', 'POST', { correo: form.correoRec.value.trim() });
        mostrar(alerta, r.mensaje, 'success');
    } catch (error) {
        mostrar(alerta, error.message, 'danger');
    }
});