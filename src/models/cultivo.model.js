import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ESTADOS_CULTIVO = ['En curso', 'Finalizado', 'Inactivo'];
export const TIPOS_SUELO = [
    'Arcilloso', 'Arenoso', 'Limoso', 'Franco',
    'Franco-arcilloso', 'Franco-arenoso', 'Humífero', 'Pedregoso'
];

const Cultivo = sequelize.define('Cultivo', {
    idcultivo: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    codigoc: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: 'uq_cultivo_codigoc'
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    imagen: {
        type: DataTypes.BLOB('medium'),
        allowNull: false
    },
    imagen_tipo: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    idlote: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    idtipocultivo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    // Requerimientos climáticos y de suelo
    temp_min: { type: DataTypes.DECIMAL(5, 2), allowNull: false },   // °C
    temp_max: { type: DataTypes.DECIMAL(5, 2), allowNull: false },   // °C
    ph_min: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        validate: { min: 0, max: 14 }
    },
    ph_max: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        validate: { min: 0, max: 14 }
    },
    tipo_suelo: {
        type: DataTypes.ENUM(...TIPOS_SUELO),
        allowNull: false,
        validate: { isIn: { args: [TIPOS_SUELO], msg: 'Tipo de suelo no válido' } }
    },
    agua_semana: {
        type: DataTypes.DECIMAL(8, 2), // mm por semana
        allowNull: false,
        validate: { min: { args: [0], msg: 'La necesidad de agua no puede ser negativa' } }
    },
    ciclo_dias: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: { args: [1], msg: 'El ciclo debe ser de al menos 1 día' } }
    },

    fecha_siembra: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_cierre: { type: DataTypes.DATEONLY, allowNull: true },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_CULTIVO),
        allowNull: false,
        defaultValue: 'En curso'
    }
}, {
    tableName: 'cultivo',
    defaultScope: { attributes: { exclude: ['imagen'] } },
    validate: {
        rangos() {
            if (Number(this.temp_min) >= Number(this.temp_max)) {
                throw new Error('La temperatura mínima debe ser menor que la máxima');
            }
            if (Number(this.ph_min) >= Number(this.ph_max)) {
                throw new Error('El pH mínimo debe ser menor que el máximo');
            }
        }
    }
});

export default Cultivo;
