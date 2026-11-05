import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Usuario = sequelize.define('Usuario', {
  idusuario: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  nombreu: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  contrasena: {
    type: DataTypes.STRING(255), // hash, nunca la clave real
    allowNull: false
  },
  idperfil: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  idpersona: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true // garantiza la relación 1 a 1
  },
  rol: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, { tableName: 'usuario' });

export default Usuario;