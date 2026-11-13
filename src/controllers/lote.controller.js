import { randomUUID } from 'crypto';
import { Lote, Cultivo, Usuario } from '../models/index.js';

const incluir = [
  // Cultivo en curso del lote (como máximo uno)
  {
    model: Cultivo,
    as: 'cultivos',
    where: { estado: 'En curso' },
    required: false,
    attributes: ['idcultivo', 'codigoc', 'nombre']
  },
  { model: Usuario, as: 'usuario', attributes: ['idusuario', 'nombreu'] }
];

// El productor ve solo sus lotes; el administrador ve todos
const filtroPropietario = (req) =>
  req.usuario.rol === 'admin' ? {} : { idusuario: req.usuario.idusuario };

const buscarLote = (req) =>
  Lote.findOne({ where: { idlote: req.params.id, ...filtroPropietario(req) } });

const tieneCultivoEnCurso = async (idlote) =>
  (await Cultivo.count({ where: { idlote, estado: 'En curso' } })) > 0;

const responderError = (res, error, accion) => {
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ mensaje: error.errors.map((e) => e.message) });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ mensaje: 'Ya existe un lote con ese código' });
  }
  res.status(500).json({ mensaje: `Error al ${accion}`, error: error.message });
};

// "Mis lotes": área, clima, cultivo en curso y estado. ?activos=true para listas desplegables
export const listar = async (req, res) => {
  try {
    const lotes = await Lote.findAll({
      where: {
        ...filtroPropietario(req),
        ...(req.query.activos === 'true' && { estado: true })
      },
      include: incluir,
      order: [['codigol', 'ASC']]
    });
    res.json(lotes);
  } catch (error) {
    responderError(res, error, 'listar lotes');
  }
};

export const obtener = async (req, res) => {
  try {
    const lote = await Lote.findOne({
      where: { idlote: req.params.id, ...filtroPropietario(req) },
      include: incluir
    });
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
    res.json(lote);
  } catch (error) {
    responderError(res, error, 'obtener el lote');
  }
};

export const crear = async (req, res) => {
  try {
    const codigol = req.body.codigol?.trim().toUpperCase();
    const descripcion = req.body.descripcion?.trim();
    const { area, clima } = req.body;

    if (!codigol || !descripcion || area === undefined || !clima) {
      return res.status(400).json({ mensaje: 'codigol, descripcion, area y clima son obligatorios' });
    }
    if (await Lote.findOne({ where: { codigol } })) {
      return res.status(409).json({ mensaje: 'Ya existe un lote con ese código' });
    }

    // El lote queda Activo y asociado al productor que lo registra
    const lote = await Lote.create({
      idlote: randomUUID(),
      codigol,
      descripcion,
      area,
      clima,
      idusuario: req.usuario.idusuario,
      estado: true
    });
    res.status(201).json(lote);
  } catch (error) {
    responderError(res, error, 'crear el lote');
  }
};

// Se pueden modificar descripción, área y clima; el códigol no
export const actualizar = async (req, res) => {
  try {
    const lote = await buscarLote(req);
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });

    if (req.body.codigol !== undefined && req.body.codigol.trim().toUpperCase() !== lote.codigol) {
      return res.status(400).json({ mensaje: 'El código del lote no se puede modificar' });
    }

    const { descripcion, area, clima, estado } = req.body;
    const cambios = {};
    if (descripcion !== undefined) cambios.descripcion = descripcion.trim();
    if (area !== undefined) cambios.area = area;
    if (clima !== undefined) cambios.clima = clima;

    if (typeof estado === 'boolean') {
      if (!estado && await tieneCultivoEnCurso(lote.idlote)) {
        return res.status(400).json({ mensaje: 'No se puede inhabilitar un lote con un cultivo En curso' });
      }
      cambios.estado = estado;
    }

    await lote.update(cambios);
    res.json(lote);
  } catch (error) {
    responderError(res, error, 'actualizar el lote');
  }
};

// Eliminación lógica: no se permite si el lote tiene un cultivo En curso
export const eliminar = async (req, res) => {
  try {
    const lote = await buscarLote(req);
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });

    if (await tieneCultivoEnCurso(lote.idlote)) {
      return res.status(400).json({ mensaje: 'No se puede inhabilitar un lote con un cultivo En curso' });
    }

    await lote.update({ estado: false });
    res.json({ mensaje: 'Lote inhabilitado' });
  } catch (error) {
    responderError(res, error, 'eliminar el lote');
  }
};
