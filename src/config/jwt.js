import { SignJWT, jwtVerify } from 'jose';

const secreto = new TextEncoder().encode(process.env.JWT_SECRET);

export const generarToken = async (usuario) => {
  return await new SignJWT({ rol: usuario.rol, idperfil: usuario.idperfil })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuario.idusuario)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '2h')
    .sign(secreto);
};

export const verificarToken = async (token) => {
  const { payload } = await jwtVerify(token, secreto);
  return payload;
};