import bcrypt from 'bcryptjs';
import { Usuario, Perfil, Persona } from '../models/index.js';
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