import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TipoCultivo = sequelize.define('TipoCultivo', {
    idtipocultivo: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    codigotc: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: 'uq_tipo_cultivo_codigotc'
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: 'uq_tipo_cultivo_descripcion'
    },
    imagen: {
        type: DataTypes.BLOB('medium'), // archivo JPG/PNG guardado en la BD (máx. 2 MB)
        allowNull: false
    },
    imagen_tipo: {
        type: DataTypes.STRING(20), // image/jpeg | image/png
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'tipo_cultivo',
    // La imagen no viaja en los listados; se sirve aparte en /api/tipos-cultivo/:id/imagen
    defaultScope: { attributes: { exclude: ['imagen'] } }
});

export default TipoCultivo;
