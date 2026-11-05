import bcrypt from 'bcryptjs';
import { Usuario, Perfil, Persona } from '../models/index.js';
import { generarToken } from '../config/jwt.js';

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