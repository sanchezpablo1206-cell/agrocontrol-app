import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { TipoCultivo } from '../models/index.js';
import { enviarImagen } from '../middlewares/imagen.middleware.js';

const responderError = (res, error, accion) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ mensaje: 'Ya existe un tipo de cultivo con ese código o descripción' });
  }
  res.status(500).json({ mensaje: `Error al ${accion}`, error: error.message });
};

// El administrador ve todos; el productor solo los activos. Siempre en orden alfabético.
export const listar = async (req, res) => {
  try {
    const soloActivos = req.usuario.rol !== 'admin' || req.query.activos === 'true';
    const tipos = await TipoCultivo.findAll({
      where: soloActivos ? { estado: true } : {},
      order: [['descripcion', 'ASC']]
    });
    res.json(tipos);
  } catch (error) {
    responderError(res, error, 'listar tipos de cultivo');
  }
};

export const obtener = async (req, res) => {
  try {
    const tipo = await TipoCultivo.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de cultivo no encontrado' });
    res.json(tipo);
  } catch (error) {
    responderError(res, error, 'obtener el tipo de cultivo');
  }
};

export const imagen = async (req, res) => {
  try {
    enviarImagen(res, await TipoCultivo.unscoped().findByPk(req.params.id));
  } catch (error) {
    responderError(res, error, 'obtener la imagen');
  }
};

export const crear = async (req, res) => {
  try {
    const codigotc = req.body.codigotc?.trim().toUpperCase();
    const descripcion = req.body.descripcion?.trim();

    if (!codigotc || !descripcion || !req.imagen) {
      return res.status(400).json({ mensaje: 'codigotc, descripcion e imagen son obligatorios' });
    }

    const repetido = await TipoCultivo.findOne({
      where: { [Op.or]: [{ codigotc }, { descripcion }] }
    });
    if (repetido) {
      const campo = repetido.codigotc === codigotc ? 'código' : 'descripción';
      return res.status(409).json({ mensaje: `Ya existe un tipo de cultivo con ese ${campo}` });
    }

    const { idtipocultivo } = await TipoCultivo.create({
      idtipocultivo: randomUUID(),
      codigotc,
      descripcion,
      imagen: req.imagen.buffer,
      imagen_tipo: req.imagen.tipo,
      estado: true // queda Activo
    });
    res.status(201).json(await TipoCultivo.findByPk(idtipocultivo));
  } catch (error) {
    responderError(res, error, 'crear el tipo de cultivo');
  }
};

// Se modifican descripción e imagen; el codigotc no se puede modificar
export const actualizar = async (req, res) => {
  try {
    const tipo = await TipoCultivo.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de cultivo no encontrado' });

    if (req.body.codigotc !== undefined && req.body.codigotc.trim().toUpperCase() !== tipo.codigotc) {
      return res.status(400).json({ mensaje: 'El código del tipo de cultivo no se puede modificar' });
    }

    const cambios = {};
    if (req.body.descripcion !== undefined) {
      const descripcion = req.body.descripcion.trim();
      if (!descripcion) return res.status(400).json({ mensaje: 'descripcion no puede estar vacía' });

      const repetido = await TipoCultivo.findOne({
        where: { descripcion, idtipocultivo: { [Op.ne]: tipo.idtipocultivo } }
      });
      if (repetido) return res.status(409).json({ mensaje: 'Ya existe un tipo de cultivo con esa descripción' });

      cambios.descripcion = descripcion;
    }
    if (req.imagen) {
      cambios.imagen = req.imagen.buffer;
      cambios.imagen_tipo = req.imagen.tipo;
    }
    if (typeof req.body.estado === 'boolean') cambios.estado = req.body.estado;

    await tipo.update(cambios);
    res.json(await TipoCultivo.findByPk(tipo.idtipocultivo));
  } catch (error) {
    responderError(res, error, 'actualizar el tipo de cultivo');
  }
};

// Eliminación lógica: los cultivos ya registrados conservan su tipo
export const eliminar = async (req, res) => {
  try {
    const tipo = await TipoCultivo.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de cultivo no encontrado' });

    await tipo.update({ estado: false });
    res.json({ mensaje: 'Tipo de cultivo inhabilitado' });
  } catch (error) {
    responderError(res, error, 'eliminar el tipo de cultivo');
  }
};
