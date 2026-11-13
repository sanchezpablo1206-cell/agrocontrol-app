import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TipoGasto = sequelize.define('TipoGasto', {
    idtipogasto: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    codigotg: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: 'uq_tipo_gasto_codigotg' // índice con nombre: evita duplicarlo con sync alter
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: 'uq_tipo_gasto_descripcion'
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, { tableName: 'tipo_gasto' });

export default TipoGasto;
