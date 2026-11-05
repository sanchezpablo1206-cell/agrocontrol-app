import { verificarToken } from '../config/jwt.js';
import { Usuario } from '../models/index.js';

export const autenticar = async (req, res, next) => {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ mensaje: 'Token requerido' });
    }

    const payload = await verificarToken(token);

    // Se consulta la BD en cada petición: si el admin inhabilita a alguien,
    // su token deja de servir de inmediato.
    const usuario = await Usuario.findByPk(payload.sub, {
      attributes: ['idusuario', 'rol', 'idperfil', 'estado']
    });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no existe' });
    }
    if (!usuario.estado) {
      return res.status(403).json({ mensaje: 'Usuario inhabilitado' });
    }

    req.usuario = {
      idusuario: usuario.idusuario,
      rol: usuario.rol,
      idperfil: usuario.idperfil
    };
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};