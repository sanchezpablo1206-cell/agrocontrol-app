import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Perfil = sequelize.define('Perfil', {
    idperfil: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    descripc: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, { tableName: 'perfil' });

export default Perfil;