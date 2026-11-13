import { randomUUID } from 'crypto';
import { Gasto, TipoGasto, Usuario, Cultivo, Lote } from '../models/index.js';

const incluir = [
  { model: TipoGasto, as: 'tipoGasto' },
  { model: Usuario, as: 'usuario', attributes: ['idusuario', 'nombreu'] },
  {
    model: Cultivo,
    as: 'cultivo',
    attributes: ['idcultivo', 'codigoc', 'nombre', 'estado'],
    include: [{ model: Lote, as: 'lote', attributes: ['idlote', 'codigol'] }]
  }
];

// El administrador ve todos los gastos; el productor solo los suyos
const filtroPropietario = (req) =>
  req.usuario.rol === 'admin' ? {} : { idusuario: req.usuario.idusuario };

const buscarGasto = (req) =>
  Gasto.findOne({ where: { idgasto: req.params.id, ...filtroPropietario(req) }, include: incluir });

const montoValido = (monto) => Number.isFinite(Number(monto)) && Number(monto) > 0;

// El cultivo debe ser del productor (a través de su lote) y estar En curso:
// un cultivo Finalizado o Inactivo no admite nuevos gastos.
const validarCultivo = async (req, idcultivo) => {
  const cultivo = await Cultivo.findOne({
    where: { idcultivo },
    include: [{ model: Lote, as: 'lote', where: filtroPropietario(req) }]
  });
  if (!cultivo) return 'El cultivo no existe o no es tuyo';
  if (cultivo.estado !== 'En curso') return `El cultivo está ${cultivo.estado} y no admite nuevos gastos`;
  return null;
};

const validarTipo = async (idtipogasto) => {
  const tipo = await TipoGasto.findByPk(idtipogasto);
  return tipo?.estado ? null : 'El tipo de gasto no existe o está inhabilitado';
};

// Filtro opcional: ?idcultivo=
export const listar = async (req, res) => {
  try {
    const gastos = await Gasto.findAll({
      where: {
        ...filtroPropietario(req),
        ...(req.query.idcultivo && { idcultivo: req.query.idcultivo })
      },
      include: incluir,
      order: [['fecha', 'DESC']]
    });
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar gastos', error: error.message });
  }
};

export const obtener = async (req, res) => {
  try {
    const gasto = await buscarGasto(req);
    if (!gasto) return res.status(404).json({ mensaje: 'Gasto no encontrado' });
    res.json(gasto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el gasto', error: error.message });
  }
};

export const crear = async (req, res) => {
  try {
    const { idcultivo, idtipogasto, monto, fecha, descripcion } = req.body;

    if (!idcultivo || !idtipogasto || monto === undefined) {
      return res.status(400).json({ mensaje: 'idcultivo, idtipogasto y monto son obligatorios' });
    }
    if (!montoValido(monto)) {
      return res.status(400).json({ mensaje: 'El monto debe ser un número mayor a 0' });
    }

    const errorCultivo = await validarCultivo(req, idcultivo);
    if (errorCultivo) return res.status(400).json({ mensaje: errorCultivo });

    const errorTipo = await validarTipo(idtipogasto);
    if (errorTipo) return res.status(404).json({ mensaje: errorTipo });

    const { idgasto } = await Gasto.create({
      idgasto: randomUUID(),
      idusuario: req.usuario.idusuario, // quien registra el gasto
      idcultivo,
      idtipogasto,
      monto,
      fecha: fecha || undefined,
      descripcion
    });

    res.status(201).json(await Gasto.findByPk(idgasto, { include: incluir }));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el gasto', error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const gasto = await buscarGasto(req);
    if (!gasto) return res.status(404).json({ mensaje: 'Gasto no encontrado' });

    const { idcultivo, idtipogasto, monto, fecha, descripcion, estado } = req.body;
    const cambios = {};

    // Mover el gasto a otro cultivo solo si ese cultivo está En curso
    if (idcultivo && idcultivo !== gasto.idcultivo) {
      const errorCultivo = await validarCultivo(req, idcultivo);
      if (errorCultivo) return res.status(400).json({ mensaje: errorCultivo });
      cambios.idcultivo = idcultivo;
    }
    // Solo se valida el tipo si cambia: un gasto puede conservar un tipo ya inhabilitado
    if (idtipogasto && idtipogasto !== gasto.idtipogasto) {
      const errorTipo = await validarTipo(idtipogasto);
      if (errorTipo) return res.status(404).json({ mensaje: errorTipo });
      cambios.idtipogasto = idtipogasto;
    }
    if (monto !== undefined) {
      if (!montoValido(monto)) return res.status(400).json({ mensaje: 'El monto debe ser un número mayor a 0' });
      cambios.monto = monto;
    }
    if (fecha) cambios.fecha = fecha;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (typeof estado === 'boolean') cambios.estado = estado;

    await gasto.update(cambios);
    res.json(await Gasto.findByPk(gasto.idgasto, { include: incluir }));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el gasto', error: error.message });
  }
};

// Eliminación lógica
export const eliminar = async (req, res) => {
  try {
    const gasto = await buscarGasto(req);
    if (!gasto) return res.status(404).json({ mensaje: 'Gasto no encontrado' });

    await gasto.update({ estado: false });
    res.json({ mensaje: 'Gasto inhabilitado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el gasto', error: error.message });
  }
};
