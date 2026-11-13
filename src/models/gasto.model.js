import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Gasto = sequelize.define('Gasto', {
    idgasto: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    idusuario: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    idtipogasto: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    idcultivo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    monto: {
        type: DataTypes.DECIMAL(14, 2), // valor gastado
        allowNull: false,
        validate: { min: 0.01 }
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    descripcion: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, { tableName: 'gasto' });

export default Gasto;
