import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { Cultivo, Lote, TipoCultivo } from '../models/index.js';
import { ESTADOS_CULTIVO } from '../models/cultivo.model.js';
import { enviarImagen } from '../middlewares/imagen.middleware.js';

const REQUERIMIENTOS = ['temp_min', 'temp_max', 'ph_min', 'ph_max', 'tipo_suelo', 'agua_semana', 'ciclo_dias'];

const hoy = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// El productor solo accede a cultivos de sus lotes; el administrador a todos
const filtroPropietario = (req) =>
  req.usuario.rol === 'admin' ? {} : { idusuario: req.usuario.idusuario };

const incluir = (req) => [
  {
    model: Lote,
    as: 'lote',
    where: filtroPropietario(req),
    attributes: ['idlote', 'codigol', 'descripcion', 'idusuario', 'estado']
  },
  { model: TipoCultivo, as: 'tipoCultivo', attributes: ['idtipocultivo', 'codigotc', 'descripcion', 'estado'] }
];

const buscarCultivo = (req) =>
  Cultivo.findOne({ where: { idcultivo: req.params.id }, include: incluir(req) });

const loteConCultivoEnCurso = async (idlote, excepto) =>
  (await Cultivo.count({
    where: { idlote, estado: 'En curso', ...(excepto && { idcultivo: { [Op.ne]: excepto } }) }
  })) > 0;

const validarTipoActivo = async (idtipocultivo) => {
  const tipo = await TipoCultivo.findByPk(idtipocultivo);
  return tipo?.estado ? null : 'El tipo de cultivo no existe o está inhabilitado';
};

const responderError = (res, error, accion) => {
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ mensaje: error.errors.map((e) => e.message) });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ mensaje: 'Ya existe un cultivo con ese código' });
  }
  res.status(500).json({ mensaje: `Error al ${accion}`, error: error.message });
};

// Filtros opcionales: ?idlote= &idtipocultivo= &estado=
export const listar = async (req, res) => {
  try {
    const { idlote, idtipocultivo, estado } = req.query;
    const cultivos = await Cultivo.findAll({
      where: {
        ...(idlote && { idlote }),
        ...(idtipocultivo && { idtipocultivo }),
        ...(ESTADOS_CULTIVO.includes(estado) && { estado })
      },
      include: incluir(req),
      order: [['fecha_siembra', 'DESC']]
    });
    res.json(cultivos);
  } catch (error) {
    responderError(res, error, 'listar cultivos');
  }
};

export const obtener = async (req, res) => {
  try {
    const cultivo = await buscarCultivo(req);
    if (!cultivo) return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
    res.json(cultivo);
  } catch (error) {
    responderError(res, error, 'obtener el cultivo');
  }
};

export const imagen = async (req, res) => {
  try {
    enviarImagen(res, await Cultivo.unscoped().findByPk(req.params.id));
  } catch (error) {
    responderError(res, error, 'obtener la imagen');
  }
};

export const crear = async (req, res) => {
  try {
    const codigoc = req.body.codigoc?.trim().toUpperCase();
    const nombre = req.body.nombre?.trim();
    const { idlote, idtipocultivo, fecha_siembra } = req.body;

    const faltantes = REQUERIMIENTOS.filter((c) => req.body[c] === undefined || req.body[c] === '');
    if (!codigoc || !nombre || !idlote || !idtipocultivo || !fecha_siembra || faltantes.length) {
      return res.status(400).json({
        mensaje: 'codigoc, nombre, idlote, idtipocultivo, fecha_siembra y todos los requerimientos son obligatorios'
      });
    }
    if (!req.imagen) return res.status(400).json({ mensaje: 'La imagen del cultivo es obligatoria' });
    if (fecha_siembra > hoy()) {
      return res.status(400).json({ mensaje: 'La fecha de siembra no puede ser posterior a hoy' });
    }

    const lote = await Lote.findOne({ where: { idlote, ...filtroPropietario(req) } });
    if (!lote || !lote.estado) {
      return res.status(404).json({ mensaje: 'El lote no existe, no es tuyo o está inhabilitado' });
    }
    if (await loteConCultivoEnCurso(idlote)) {
      return res.status(400).json({ mensaje: 'El lote ya tiene un cultivo En curso' });
    }

    const errorTipo = await validarTipoActivo(idtipocultivo);
    if (errorTipo) return res.status(404).json({ mensaje: errorTipo });

    if (await Cultivo.findOne({ where: { codigoc } })) {
      return res.status(409).json({ mensaje: 'Ya existe un cultivo con ese código' });
    }

    const { idcultivo } = await Cultivo.create({
      idcultivo: randomUUID(),
      codigoc,
      nombre,
      idlote,
      idtipocultivo,
      fecha_siembra,
      imagen: req.imagen.buffer,
      imagen_tipo: req.imagen.tipo,
      ...Object.fromEntries(REQUERIMIENTOS.map((c) => [c, req.body[c]])),
      estado: 'En curso'
    });

    req.params.id = idcultivo;
    res.status(201).json(await buscarCultivo(req));
  } catch (error) {
    responderError(res, error, 'crear el cultivo');
  }
};

// Solo se editan cultivos En curso. El códigoc y el lote no se modifican.
export const actualizar = async (req, res) => {
  try {
    const cultivo = await buscarCultivo(req);
    if (!cultivo) return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
    if (cultivo.estado !== 'En curso') {
      return res.status(400).json({ mensaje: `No se puede modificar un cultivo ${cultivo.estado}` });
    }

    if (req.body.codigoc !== undefined && req.body.codigoc.trim().toUpperCase() !== cultivo.codigoc) {
      return res.status(400).json({ mensaje: 'El código del cultivo no se puede modificar' });
    }
    if (req.body.idlote !== undefined && req.body.idlote !== cultivo.idlote) {
      return res.status(400).json({ mensaje: 'El lote del cultivo no se puede modificar' });
    }

    const cambios = Object.fromEntries(
      [...REQUERIMIENTOS, 'nombre', 'fecha_siembra']
        .filter((c) => req.body[c] !== undefined && req.body[c] !== '')
        .map((c) => [c, req.body[c]])
    );

    if (cambios.fecha_siembra && cambios.fecha_siembra > hoy()) {
      return res.status(400).json({ mensaje: 'La fecha de siembra no puede ser posterior a hoy' });
    }
    if (req.body.idtipocultivo && req.body.idtipocultivo !== cultivo.idtipocultivo) {
      const errorTipo = await validarTipoActivo(req.body.idtipocultivo);
      if (errorTipo) return res.status(404).json({ mensaje: errorTipo });
      cambios.idtipocultivo = req.body.idtipocultivo;
    }
    if (req.imagen) {
      cambios.imagen = req.imagen.buffer;
      cambios.imagen_tipo = req.imagen.tipo;
    }

    await cultivo.update(cambios);
    res.json(await buscarCultivo(req));
  } catch (error) {
    responderError(res, error, 'actualizar el cultivo');
  }
};

// Al terminar el ciclo: se registra la fecha de cierre y pasa a Finalizado
export const finalizar = async (req, res) => {
  try {
    const cultivo = await buscarCultivo(req);
    if (!cultivo) return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
    if (cultivo.estado !== 'En curso') {
      return res.status(400).json({ mensaje: 'Solo se puede finalizar un cultivo En curso' });
    }

    const { fecha_cierre } = req.body;
    if (!fecha_cierre) return res.status(400).json({ mensaje: 'fecha_cierre es obligatoria' });
    if (fecha_cierre < cultivo.fecha_siembra) {
      return res.status(400).json({ mensaje: 'La fecha de cierre no puede ser anterior a la de siembra' });
    }
    if (fecha_cierre > hoy()) {
      return res.status(400).json({ mensaje: 'La fecha de cierre no puede ser posterior a hoy' });
    }

    await cultivo.update({ fecha_cierre, estado: 'Finalizado' });
    res.json(await buscarCultivo(req));
  } catch (error) {
    responderError(res, error, 'finalizar el cultivo');
  }
};

// Eliminación lógica: el cultivo conserva sus gastos (y futuras cosechas y ventas)
export const eliminar = async (req, res) => {
  try {
    const cultivo = await buscarCultivo(req);
    if (!cultivo) return res.status(404).json({ mensaje: 'Cultivo no encontrado' });

    await cultivo.update({ estado: 'Inactivo' });
    res.json({ mensaje: 'Cultivo inhabilitado' });
  } catch (error) {
    responderError(res, error, 'eliminar el cultivo');
  }
};

// Vuelve a su estado anterior: Finalizado si tiene fecha de cierre, si no En curso
export const habilitar = async (req, res) => {
  try {
    const cultivo = await buscarCultivo(req);
    if (!cultivo) return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
    if (cultivo.estado !== 'Inactivo') {
      return res.status(400).json({ mensaje: 'El cultivo ya está habilitado' });
    }

    const estado = cultivo.fecha_cierre ? 'Finalizado' : 'En curso';
    if (estado === 'En curso') {
      if (!cultivo.lote.estado) {
        return res.status(400).json({ mensaje: 'El lote del cultivo está inhabilitado' });
      }
      if (await loteConCultivoEnCurso(cultivo.idlote, cultivo.idcultivo)) {
        return res.status(400).json({ mensaje: 'El lote ya tiene otro cultivo En curso' });
      }
    }

    await cultivo.update({ estado });
    res.json(await buscarCultivo(req));
  } catch (error) {
    responderError(res, error, 'habilitar el cultivo');
  }
};
