import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { TipoGasto } from '../models/index.js';

// El administrador ve todos los tipos; el productor (user) solo los activos.
// ?activos=true fuerza el filtro también para el administrador (listas desplegables).
export const listar = async (req, res) => {
  try {
    const soloActivos = req.usuario.rol !== 'admin' || req.query.activos === 'true';
    const tipos = await TipoGasto.findAll({
      where: soloActivos ? { estado: true } : {},
      order: [['descripcion', 'ASC']]
    });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar tipos de gasto', error: error.message });
  }
};

export const obtener = async (req, res) => {
  try {
    const tipo = await TipoGasto.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de gasto no encontrado' });
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el tipo de gasto', error: error.message });
  }
};

export const crear = async (req, res) => {
  try {
    const codigotg = req.body.codigotg?.trim().toUpperCase();
    const descripcion = req.body.descripcion?.trim();

    if (!codigotg || !descripcion) {
      return res.status(400).json({ mensaje: 'codigotg y descripcion son obligatorios' });
    }

    const repetido = await TipoGasto.findOne({
      where: { [Op.or]: [{ codigotg }, { descripcion }] }
    });
    if (repetido) {
      const campo = repetido.codigotg === codigotg ? 'código' : 'descripción';
      return res.status(409).json({ mensaje: `Ya existe un tipo de gasto con ese ${campo}` });
    }

    // Todo tipo nuevo queda Activo
    const tipo = await TipoGasto.create({ idtipogasto: randomUUID(), codigotg, descripcion, estado: true });
    res.status(201).json(tipo);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ mensaje: 'Ya existe un tipo de gasto con ese código o descripción' });
    }
    res.status(500).json({ mensaje: 'Error al crear el tipo de gasto', error: error.message });
  }
};

// El codigotg no se puede modificar; solo descripcion y estado.
export const actualizar = async (req, res) => {
  try {
    const tipo = await TipoGasto.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de gasto no encontrado' });

    if (req.body.codigotg !== undefined && req.body.codigotg.trim().toUpperCase() !== tipo.codigotg) {
      return res.status(400).json({ mensaje: 'El código del tipo de gasto no se puede modificar' });
    }

    const cambios = {};
    if (req.body.descripcion !== undefined) {
      const descripcion = req.body.descripcion.trim();
      if (!descripcion) return res.status(400).json({ mensaje: 'descripcion no puede estar vacía' });

      const repetido = await TipoGasto.findOne({
        where: { descripcion, idtipogasto: { [Op.ne]: tipo.idtipogasto } }
      });
      if (repetido) return res.status(409).json({ mensaje: 'Ya existe un tipo de gasto con esa descripción' });

      cambios.descripcion = descripcion;
    }
    if (typeof req.body.estado === 'boolean') cambios.estado = req.body.estado;

    await tipo.update(cambios);
    res.json(tipo);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ mensaje: 'Ya existe un tipo de gasto con esa descripción' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar el tipo de gasto', error: error.message });
  }
};

// Eliminación lógica: los gastos ya registrados conservan su tipo
export const eliminar = async (req, res) => {
  try {
    const tipo = await TipoGasto.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ mensaje: 'Tipo de gasto no encontrado' });

    await tipo.update({ estado: false });
    res.json({ mensaje: 'Tipo de gasto inhabilitado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el tipo de gasto', error: error.message });
  }
};
