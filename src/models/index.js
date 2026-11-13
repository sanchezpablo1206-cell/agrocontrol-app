import { sequelize } from '../config/database.js';
import Perfil from './perfil.model.js';
import Persona from './persona.model.js';
import Usuario from './usuario.model.js';
import TipoGasto from './tipogasto.model.js';
import Gasto from './gasto.model.js';
import Lote from './lote.model.js';
import TipoCultivo from './tipocultivo.model.js';
import Cultivo from './cultivo.model.js';
import { prepararDatosExistentes } from './preparar-datos.js';

// Perfil 1 ── N Usuario
Perfil.hasMany(Usuario, { foreignKey: 'idperfil', as: 'usuarios' });
Usuario.belongsTo(Perfil, { foreignKey: 'idperfil', as: 'perfil' });

// Persona 1 ── 1 Usuario
Persona.hasOne(Usuario, { foreignKey: 'idpersona', as: 'usuario' });
Usuario.belongsTo(Persona, { foreignKey: 'idpersona', as: 'persona' });

// Usuario 1 ── N Lote (el productor dueño del lote)
Usuario.hasMany(Lote, { foreignKey: 'idusuario', as: 'lotes' });
Lote.belongsTo(Usuario, { foreignKey: 'idusuario', as: 'usuario' });

// Lote 1 ── N Cultivo (historial de siembras del lote)
Lote.hasMany(Cultivo, { foreignKey: 'idlote', as: 'cultivos' });
Cultivo.belongsTo(Lote, { foreignKey: 'idlote', as: 'lote' });

// TipoCultivo 1 ── N Cultivo (al cambiar descripción o imagen del tipo se refleja en sus cultivos)
TipoCultivo.hasMany(Cultivo, { foreignKey: 'idtipocultivo', as: 'cultivos' });
Cultivo.belongsTo(TipoCultivo, { foreignKey: 'idtipocultivo', as: 'tipoCultivo' });

// Cultivo 1 ── N Gasto (cada gasto se carga a un cultivo)
Cultivo.hasMany(Gasto, { foreignKey: 'idcultivo', as: 'gastos' });
Gasto.belongsTo(Cultivo, { foreignKey: 'idcultivo', as: 'cultivo' });

// Usuario 1 ── N Gasto (quien registró el gasto)
Usuario.hasMany(Gasto, { foreignKey: 'idusuario', as: 'gastos' });
Gasto.belongsTo(Usuario, { foreignKey: 'idusuario', as: 'usuario' });

// TipoGasto 1 ── N Gasto (al cambiar la descripción del tipo se refleja en todos sus gastos)
TipoGasto.hasMany(Gasto, { foreignKey: 'idtipogasto', as: 'gastos' });
Gasto.belongsTo(TipoGasto, { foreignKey: 'idtipogasto', as: 'tipoGasto' });

// Sin migraciones: Sequelize crea y sincroniza las tablas a partir de estos modelos.
// alter:true agrega las columnas nuevas sin borrar los datos; antes se ajustan
// los registros existentes para que cumplan las columnas nuevas obligatorias.
export const sincronizarTablas = async () => {
  await prepararDatosExistentes(sequelize);
  await sequelize.sync({ alter: true });
};

export { sequelize, Perfil, Persona, Usuario, TipoGasto, Gasto, Lote, TipoCultivo, Cultivo };
