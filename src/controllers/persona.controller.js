import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { sequelize, Persona, Usuario } from '../models/index.js';

const CAMPOS = ['documento', 'nom1', 'nom2', 'apell1', 'apell2', 'direccion', 'tele', 'movil', 'correo', 'fecha_nac', 'estado'];

// El productor puede editar sus datos, excepto documento y estado
const CAMPOS_PROPIOS = CAMPOS.filter((c) => !['documento', 'estado'].includes(c));

// Toma solo los campos permitidos; los textos vacíos se guardan como null (campos opcionales)
const tomarCampos = (body, permitidos = CAMPOS) =>
    Object.fromEntries(
        permitidos
            .filter((c) => body[c] !== undefined)
            .map((c) => [c, typeof body[c] === 'string' ? body[c].trim() || null : body[c]])
    );

// Número de lotes activos del productor (persona → usuario → lote)
const numeroLotes = [
    sequelize.literal(`(
        SELECT COUNT(*) FROM lote l
        INNER JOIN usuario u ON u.idusuario = l.idusuario
        WHERE u.idpersona = Persona.idpersona AND l.estado = true
    )`),
    'numLotes'
];

// Documento y correo no se pueden repetir entre personas
const validarUnicos = async ({ documento, correo }, idActual) => {
    const condiciones = [];
    if (documento) condiciones.push({ documento });
    if (correo) condiciones.push({ correo });
    if (!condiciones.length) return null;

    const repetida = await Persona.findOne({
        where: {
            [Op.or]: condiciones,
            ...(idActual && { idpersona: { [Op.ne]: idActual } })
        }
    });
    if (!repetida) return null;
    return repetida.documento === documento
        ? 'Ya existe una persona con ese número de documento'
        : 'El correo ya está registrado';
};

const responderError = (res, error, accion) => {
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ mensaje: error.errors.map((e) => e.message) });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ mensaje: 'El documento o el correo ya están registrados' });
    }
    res.status(500).json({ mensaje: `Error al ${accion}`, error: error.message });
};

// El administrador busca por documento, nombre o apellido: ?q=texto
export const listar = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        const where = q
            ? {
                [Op.or]: ['documento', 'nom1', 'nom2', 'apell1', 'apell2'].map((c) => ({
                    [c]: { [Op.like]: `%${q}%` }
                }))
            }
            : {};

        const personas = await Persona.findAll({
            where,
            attributes: { include: [numeroLotes] },
            order: [['apell1', 'ASC'], ['nom1', 'ASC']]
        });
        res.json(personas);
    } catch (error) {
        responderError(res, error, 'listar personas');
    }
};

export const obtener = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id, { attributes: { include: [numeroLotes] } });
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });
        res.json(persona);
    } catch (error) {
        responderError(res, error, 'obtener la persona');
    }
};

export const crear = async (req, res) => {
    try {
        const datos = tomarCampos(req.body);
        delete datos.estado; // toda persona nueva queda activa

        const repetido = await validarUnicos(datos);
        if (repetido) return res.status(409).json({ mensaje: repetido });

        const persona = await Persona.create({ idpersona: randomUUID(), ...datos });
        res.status(201).json(persona);
    } catch (error) {
        responderError(res, error, 'crear la persona');
    }
};

export const actualizar = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });

        const datos = tomarCampos(req.body);
        const repetido = await validarUnicos(datos, persona.idpersona);
        if (repetido) return res.status(409).json({ mensaje: repetido });

        await persona.update(datos);
        res.json(persona);
    } catch (error) {
        responderError(res, error, 'actualizar la persona');
    }
};

// ── Datos propios del usuario que inició sesión ──
const personaDeSesion = async (req) => {
    const usuario = await Usuario.findByPk(req.usuario.idusuario, { attributes: ['idpersona'] });
    return usuario && Persona.findByPk(usuario.idpersona);
};

export const miPerfil = async (req, res) => {
    try {
        const persona = await personaDeSesion(req);
        if (!persona) return res.status(404).json({ mensaje: 'No tienes datos personales registrados' });
        res.json(persona);
    } catch (error) {
        responderError(res, error, 'obtener tus datos');
    }
};

export const actualizarMiPerfil = async (req, res) => {
    try {
        const persona = await personaDeSesion(req);
        if (!persona) return res.status(404).json({ mensaje: 'No tienes datos personales registrados' });

        const datos = tomarCampos(req.body, CAMPOS_PROPIOS);
        const repetido = await validarUnicos(datos, persona.idpersona);
        if (repetido) return res.status(409).json({ mensaje: repetido });

        await persona.update(datos);
        res.json(persona);
    } catch (error) {
        responderError(res, error, 'actualizar tus datos');
    }
};

// Eliminación lógica: se conserva la trazabilidad de sus lotes, cultivos y gastos
export const eliminar = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });

        await persona.update({ estado: false });
        res.json({ mensaje: 'Persona inhabilitada' });
    } catch (error) {
        responderError(res, error, 'eliminar la persona');
    }
};
