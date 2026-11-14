import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Perfil, Persona, Usuario } from '../models/index.js';

export const crearAdmin = async () => {
  try {
    // Perfil por defecto para quienes se registran desde la página pública
    await Perfil.findOrCreate({
      where: { descripc: 'Productor' },
      defaults: { idperfil: randomUUID() }
    });

    const existe = await Usuario.findOne({ where: { rol: 'admin' } });
    if (existe) return;

    const [perfil] = await Perfil.findOrCreate({
      where: { descripc: 'Administrador' },
      defaults: { idperfil: randomUUID() }
    });

    const persona = await Persona.create({
      idpersona: randomUUID(),
      nom1: 'Administrador',
      apell1: 'Sistema',
      documento: process.env.ADMIN_DOCUMENTO || '1000000000',
      movil: process.env.ADMIN_MOVIL || '3000000000',
      direccion: 'Por actualizar',
      fecha_nac: '1990-01-01',
      correo: process.env.ADMIN_EMAIL
    });

    await Usuario.create({
      idusuario: randomUUID(),
      nombreu: process.env.ADMIN_USER,
      contrasena: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      idperfil: perfil.idperfil,
      idpersona: persona.idpersona,
      rol: 'admin'
    });

    console.log(`✅ Administrador creado: ${process.env.ADMIN_USER}`);
  } catch (error) {
    console.error('❌ Error al crear el administrador:', error.message);
  }
};