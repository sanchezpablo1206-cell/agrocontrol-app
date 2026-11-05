import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Usuario, Perfil, Persona } from '../models/index.js';

const incluir = [
    { model: Perfil, as: 'perfil' },
    { model: Persona, as: 'persona' }
];

export const listar = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['contrasena'] },
            include: incluir
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
    }
};

export const obtener = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: { exclude: ['contrasena'] },
            include: incluir
        });
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el usuario', error: error.message });
    }
};

export const crear = async (req, res) => {
    try {
        const { nombreu, contrasena, idperfil, idpersona, rol } = req.body;

        if (!nombreu || !contrasena || !idperfil || !idpersona) {
            return res.status(400).json({
                mensaje: 'nombreu, contrasena, idperfil e idpersona son obligatorios'
            });
        }

        if (!(await Perfil.findByPk(idperfil))) {
            return res.status(404).json({ mensaje: 'El perfil no existe' });
        }
        if (!(await Persona.findByPk(idpersona))) {
            return res.status(404).json({ mensaje: 'La persona no existe' });
        }

        const usuario = await Usuario.create({
            idusuario: randomUUID(),
            nombreu,
            contrasena: await bcrypt.hash(contrasena, 10),
            idperfil,
            idpersona,
            rol
        });

        const { contrasena: _omitida, ...datos } = usuario.toJSON();
        res.status(201).json(datos);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ mensaje: 'El nombre de usuario ya existe o la persona ya tiene un usuario' });
        }
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

export const actualizar = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const { nombreu, contrasena, idperfil, rol } = req.body;
        const cambios = {};

        if (nombreu) cambios.nombreu = nombreu;
        if (idperfil) cambios.idperfil = idperfil;
        if (rol) cambios.rol = rol;
        if (contrasena) cambios.contrasena = await bcrypt.hash(contrasena, 10);

        await usuario.update(cambios);

        const { contrasena: _omitida, ...datos } = usuario.toJSON();
        res.json(datos);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ mensaje: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
    }
};

// El administrador habilita o inhabilita usuarios
export const cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;

        if (typeof estado !== 'boolean') {
            return res.status(400).json({ mensaje: 'estado debe ser true o false' });
        }
        if (req.params.id === req.usuario.idusuario) {
            return res.status(400).json({ mensaje: 'No puedes cambiar tu propio estado' });
        }

        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        await usuario.update({ estado });
        res.json({
            mensaje: estado ? 'Usuario habilitado' : 'Usuario inhabilitado',
            idusuario: usuario.idusuario,
            estado: usuario.estado
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar el estado', error: error.message });
    }
};

export const eliminar = async (req, res) => {
    try {
        if (req.params.id === req.usuario.idusuario) {
            return res.status(400).json({ mensaje: 'No puedes eliminarte a ti mismo' });
        }

        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        await usuario.update({ estado: false });
        res.json({ mensaje: 'Usuario inhabilitado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
    }
};