import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CLIMAS = ['Cálido', 'Templado', 'Frío', 'Páramo'];

const Lote = sequelize.define('Lote', {
    idlote: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    codigol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: 'uq_lote_codigol'
    },
    descripcion: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    area: {
        type: DataTypes.DECIMAL(10, 2), // hectáreas
        allowNull: false,
        validate: { min: { args: [0.01], msg: 'El área debe ser mayor que cero' } }
    },
    clima: {
        type: DataTypes.ENUM(...CLIMAS),
        allowNull: false,
        validate: { isIn: { args: [CLIMAS], msg: `El clima debe ser: ${CLIMAS.join(', ')}` } }
    },
    idusuario: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, { tableName: 'lote' });

export default Lote;
