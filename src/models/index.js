import { sequelize } from '../config/database.js';
import Perfil from './perfil.model.js';
import Persona from './persona.model.js';
import Usuario from './usuario.model.js';

// Perfil 1 ── N Usuario
Perfil.hasMany(Usuario, { foreignKey: 'idperfil', as: 'usuarios' });
Usuario.belongsTo(Perfil, { foreignKey: 'idperfil', as: 'perfil' });

// Persona 1 ── 1 Usuario
Persona.hasOne(Usuario, { foreignKey: 'idpersona', as: 'usuario' });
Usuario.belongsTo(Persona, { foreignKey: 'idpersona', as: 'persona' });

// Sin migraciones: Sequelize crea y sincroniza las tablas a partir de estos modelos.
// alter:true adapta las columnas existentes; respalda la BD antes de usarlo con datos reales.
export const sincronizarTablas = async () => {
  await sequelize.sync({ alter: true });
};

export { sequelize, Perfil, Persona, Usuario };