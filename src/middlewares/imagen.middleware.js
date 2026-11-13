// El frontend envía la imagen dentro del JSON como data URL:
//   imagen: "data:image/png;base64,iVBORw0KG..."
// Este middleware la valida y deja el archivo listo en req.imagen = { buffer, tipo }.

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// Se revisa la firma real del archivo, no solo la extensión que dice el navegador
const FIRMAS = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
};

export const procesarImagen = (req, res, next) => {
  const { imagen } = req.body;
  if (imagen === undefined || imagen === null || imagen === '') return next();

  const partes = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(imagen);
  if (!partes) {
    return res.status(400).json({ mensaje: 'La imagen debe ser JPG o PNG' });
  }

  const [, tipo, base64] = partes;
  const buffer = Buffer.from(base64, 'base64');

  if (!FIRMAS[tipo](buffer)) {
    return res.status(400).json({ mensaje: 'El archivo no es una imagen JPG o PNG válida' });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ mensaje: 'La imagen no puede pesar más de 2 MB' });
  }

  req.imagen = { buffer, tipo };
  next();
};

// Envía la imagen guardada en la BD (columnas imagen + imagen_tipo)
export const enviarImagen = (res, registro) => {
  if (!registro?.imagen) return res.status(404).json({ mensaje: 'Imagen no encontrada' });
  res.set('Content-Type', registro.imagen_tipo);
  res.set('Cache-Control', 'no-cache');
  res.send(registro.imagen);
};
