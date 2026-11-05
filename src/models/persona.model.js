import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Persona = sequelize.define('Persona', {
    idpersona: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    nom1: { type: DataTypes.STRING(50), allowNull: false },
    nom2: { type: DataTypes.STRING(50), allowNull: true },
    apell1: { type: DataTypes.STRING(50), allowNull: false },
    apell2: { type: DataTypes.STRING(50), allowNull: true },
    direccion: { type: DataTypes.STRING(150), allowNull: true },
    tele: { type: DataTypes.STRING(20), allowNull: true },
    movil: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    fecha_nac: { type: DataTypes.DATEONLY, allowNull: true },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, { tableName: 'persona' });

export default Persona;