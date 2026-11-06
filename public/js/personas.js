import { peticion } from './api.js';
import { iniciarAdmin, aviso, escapar, limpiar } from './crud-utils.js';
iniciarAdmin();
const form = document.getElementById('formCrud');
const campos = ['nom1', 'nom2', 'apell1', 'apell2', 'correo', 'movil', 'tele', 'direccion', 'fecha_nac'];
let registros = [];
const nombre = p => [p.nom1, p.nom2, p.apell1, p.apell2].filter(Boolean).join(' ');
async function cargar() {
  try { registros = await peticion('/personas'); pintar(); }
  catch (e) { aviso(e.message, 'error'); }
}
function pintar() {
  const q = document.getElementById('buscar').value.toLowerCase();
  document.getElementById('tabla').innerHTML = registros.filter(p => `${p.idpersona} ${nombre(p)} ${p.correo}`.toLowerCase().includes(q)).map(p => `<tr><td>${escapar(p.idpersona)}</td><td>${escapar(nombre(p))}</td><td>${escapar(p.correo)}</td><td>${escapar(p.movil || p.tele || '—')}</td><td><span class="estado ${p.estado ? 'activo' : 'inactivo'}">${p.estado ? 'Activo' : 'Inactivo'}</span></td><td><button class="btn-tabla" data-editar="${escapar(p.idpersona)}" ${!p.estado ? 'disabled' : ''}>Editar</button><button class="btn-tabla danger" data-estado="${escapar(p.idpersona)}" data-valor="${!p.estado}">${p.estado ? 'Inhabilitar' : 'Habilitar'}</button></td></tr>`).join('') || '<tr><td colspan="6">No hay personas para mostrar.</td></tr>';
}
form.addEventListener('submit', async e => {
  e.preventDefault(); const id = document.getElementById('idregistro').value;
  const data = Object.fromEntries(campos.map(c => [c, document.getElementById(c).value.trim() || null]));
  try { await peticion(id ? `/personas/${encodeURIComponent(id)}` : '/personas', id ? 'PUT' : 'POST', data); aviso(id ? 'Persona actualizada correctamente' : 'Persona registrada correctamente'); limpiar(form, { tituloNuevo: 'Registrar persona' }); await cargar(); }
  catch (err) { aviso(err.message, 'error'); }
});
document.getElementById('cancelar').addEventListener('click', () => limpiar(form, { tituloNuevo: 'Registrar persona' }));
document.getElementById('buscar').addEventListener('input', pintar);
document.getElementById('tabla').addEventListener('click', async e => {
  const edit = e.target.closest('[data-editar]'); const estado = e.target.closest('[data-estado]');
  if (edit) { const p = registros.find(x => x.idpersona === edit.dataset.editar); if (!p) return; document.getElementById('idregistro').value = p.idpersona; campos.forEach(c => document.getElementById(c).value = p[c] ?? ''); document.getElementById('titulo-form').textContent = 'Editar persona'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (estado) { const activar = estado.dataset.valor === 'true'; if (!confirm(`¿Deseas ${activar ? 'habilitar' : 'inhabilitar'} esta persona?`)) return; try { await peticion(`/personas/${encodeURIComponent(estado.dataset.estado)}`, 'PUT', { estado: activar }); aviso(`Persona ${activar ? 'habilitada' : 'inhabilitada'} correctamente`); await cargar(); } catch (err) { aviso(err.message, 'error'); } }
});
cargar();
