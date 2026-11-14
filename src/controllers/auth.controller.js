import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { sequelize, Usuario, Perfil, Persona } from '../models/index.js';
import { generarToken } from '../config/jwt.js';
import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { enviarCorreo } from '../config/mail.js';

export const login = async (req, res) => {
    try {
        const { nombreu, contrasena } = req.body;

        if (!nombreu || !contrasena) {
            return res.status(400).json({ mensaje: 'nombreu y contrasena son obligatorios' });
        }

        const usuario = await Usuario.findOne({ where: { nombreu } });

        // Mismo mensaje para usuario o clave incorrectos (no revela cuál falló)
        if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        if (!usuario.estado) {
            return res.status(403).json({ mensaje: 'Usuario inhabilitado' });
        }

        const token = await generarToken(usuario);

        res.json({
            token,
            usuario: {
                idusuario: usuario.idusuario,
                nombreu: usuario.nombreu,
                rol: usuario.rol,
                idperfil: usuario.idperfil
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.idusuario, {
            attributes: { exclude: ['contrasena'] },
            include: [
                { model: Perfil, as: 'perfil' },
                { model: Persona, as: 'persona' }
            ]
        });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el usuario', error: error.message });
    }
};

// El token de recuperación se firma con JWT_SECRET + hash actual de la clave:
// al cambiar la contraseña el enlace queda inválido (sirve una sola vez).
const claveReset = (u) => new TextEncoder().encode(process.env.JWT_SECRET + u.contrasena);

export const recuperar = async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ mensaje: 'El correo es obligatorio' });

        const persona = await Persona.findOne({ where: { correo } });
        const usuario = persona && await Usuario.findOne({ where: { idpersona: persona.idpersona, estado: true } });

        if (usuario) {
            const token = await new SignJWT({ proposito: 'reset' })
                .setProtectedHeader({ alg: 'HS256' })
                .setSubject(usuario.idusuario)
                .setExpirationTime('15m')
                .sign(claveReset(usuario));

            const url = `${process.env.FRONTEND_URL}/pages/restablecer.html?token=${token}`;
            await enviarCorreo(correo, 'Recuperar contraseña - AgroControl',
                `<p>Hola ${persona.nom1}, usa este enlace (vence en 15 minutos):</p><p><a href="${url}">Restablecer contraseña</a></p>`);
        }
        // Respuesta igual exista o no el correo (no revela qué correos están registrados)
        res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación' });
    } catch (error) {
        res.status(500).json({ mensaje: 'No se pudo enviar el correo', error: error.message });
    }
};

export const restablecer = async (req, res) => {
    try {
        const { token, contrasena } = req.body;
        if (!token || !contrasena || contrasena.length < 8) {
            return res.status(400).json({ mensaje: 'Token y contraseña (mínimo 8 caracteres) son obligatorios' });
        }
        const usuario = await Usuario.findByPk(decodeJwt(token).sub);
        if (!usuario) throw new Error('usuario');

        const { payload } = await jwtVerify(token, claveReset(usuario));
        if (payload.proposito !== 'reset') throw new Error('proposito');

        await usuario.update({ contrasena: await bcrypt.hash(contrasena, 10) });
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch {
        res.status(400).json({ mensaje: 'Enlace inválido o expirado' });
    }
};

// ---------------------------------------------------------------------------
// REGISTRO PÚBLICO
// ---------------------------------------------------------------------------

const CAMPOS_PERSONA = ['documento', 'nom1', 'nom2', 'apell1', 'apell2', 'direccion', 'tele', 'movil', 'correo', 'fecha_nac'];

// Perfiles que se pueden elegir al registrarse: todos los activos menos los de
// administración (el perfil "Administrador" y cualquiera que use un usuario admin).
const perfilesPublicos = async () => {
    const admins = await Usuario.findAll({ where: { rol: 'admin' }, attributes: ['idperfil'] });
    return Perfil.findAll({
        where: {
            estado: true,
            descripc: { [Op.notLike]: 'admin%' },
            idperfil: { [Op.notIn]: [...new Set(admins.map((u) => u.idperfil)), ''] }
        },
        attributes: ['idperfil', 'descripc'],
        order: [['descripc', 'ASC']]
    });
};

export const perfilesRegistro = async (req, res) => {
    try {
        res.json(await perfilesPublicos());
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar los perfiles', error: error.message });
    }
};

export const registro = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const nombreu = req.body.nombreu?.trim();
        const { contrasena, idperfil } = req.body;
        const persona = Object.fromEntries(
            CAMPOS_PERSONA.map((c) => [c, typeof req.body[c] === 'string' ? req.body[c].trim() || null : req.body[c] ?? null])
        );

        if (!nombreu || nombreu.length < 3) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El usuario debe tener al menos 3 caracteres' });
        }
        if (!contrasena || contrasena.length < 8) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // El perfil debe ser uno de los permitidos (nunca el de administrador)
        const permitidos = await perfilesPublicos();
        if (!permitidos.some((p) => p.idperfil === idperfil)) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'Selecciona un perfil válido' });
        }

        if (await Usuario.findOne({ where: { nombreu } })) {
            await t.rollback();
            return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso' });
        }
        const condiciones = [{ documento: persona.documento ?? '' }];
        if (persona.correo) condiciones.push({ correo: persona.correo });
        const repetida = await Persona.findOne({ where: { [Op.or]: condiciones } });
        if (repetida) {
            await t.rollback();
            return res.status(409).json({
                mensaje: repetida.documento === persona.documento
                    ? 'Ya existe una persona con ese número de documento'
                    : 'El correo ya está registrado'
            });
        }

        const nuevaPersona = await Persona.create({ idpersona: randomUUID(), ...persona }, { transaction: t });
        const usuario = await Usuario.create({
            idusuario: randomUUID(),
            nombreu,
            contrasena: await bcrypt.hash(contrasena, 10),
            idperfil,
            idpersona: nuevaPersona.idpersona,
            rol: 'user' // el registro público nunca crea administradores
        }, { transaction: t });

        await t.commit();

        // Queda con la sesión iniciada, igual que en el login
        res.status(201).json({
            mensaje: 'Cuenta creada correctamente',
            token: await generarToken(usuario),
            usuario: {
                idusuario: usuario.idusuario,
                nombreu: usuario.nombreu,
                rol: usuario.rol,
                idperfil: usuario.idperfil
            }
        });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ mensaje: error.errors.map((e) => e.message) });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ mensaje: 'El usuario, documento o correo ya están registrados' });
        }
        res.status(500).json({ mensaje: 'Error al registrar la cuenta', error: error.message });
    }
};
