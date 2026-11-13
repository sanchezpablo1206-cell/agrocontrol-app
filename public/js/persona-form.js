// Utilidades compartidas por el formulario de personas (admin) y "Mis datos" (productor)

// Campos editables por el propio productor (documento y estado no)
export const CAMPOS_PERSONA = ['nom1', 'nom2', 'apell1', 'apell2', 'movil', 'tele', 'direccion', 'fecha_nac', 'correo'];

export const nombreCompleto = (p) => [p?.nom1, p?.nom2, p?.apell1, p?.apell2].filter(Boolean).join(' ');

// Fecha más reciente permitida: la persona debe tener al menos 18 años
export function fechaMaximaNacimiento() {
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return limite.toLocaleDateString('en-CA');
}

// Lee el formulario; los campos vacíos se envían como null (opcionales).
// Si el formulario tiene campo documento, también se envía.
export function leerPersona() {
  const campos = document.getElementById('documento') ? ['documento', ...CAMPOS_PERSONA] : CAMPOS_PERSONA;
  return Object.fromEntries(campos.map((c) => [c, document.getElementById(c).value.trim() || null]));
}
