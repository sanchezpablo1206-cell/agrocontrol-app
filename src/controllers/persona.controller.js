import { randomUUID } from 'crypto';
import { Persona } from '../models/index.js';

const CAMPOS = ['nom1', 'nom2', 'apell1', 'apell2', 'direccion', 'tele', 'movil', 'correo', 'fecha_nac', 'estado'];

const tomarCampos = (body) =>
    Object.fromEntries(CAMPOS.filter((c) => body[c] !== undefined).map((c) => [c, body[c]]));

export const listar = async (req, res) => {
    try {
        const personas = await Persona.findAll();
        res.json(personas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar personas', error: error.message });
    }
};

export const obtener = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });
        res.json(persona);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la persona', error: error.message });
    }
};

export const crear = async (req, res) => {
    try {
        const persona = await Persona.create({ idpersona: randomUUID(), ...tomarCampos(req.body) });
        res.status(201).json(persona);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ mensaje: 'El correo ya está registrado' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ mensaje: error.errors.map((e) => e.message) });
        }
        res.status(500).json({ mensaje: 'Error al crear la persona', error: error.message });
    }
};

export const actualizar = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });

        await persona.update(tomarCampos(req.body));
        res.json(persona);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ mensaje: 'El correo ya está registrado' });
        }
        res.status(500).json({ mensaje: 'Error al actualizar la persona', error: error.message });
    }
};

export const eliminar = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada' });

        await persona.update({ estado: false });
        res.json({ mensaje: 'Persona inhabilitada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la persona', error: error.message });
    }
};