import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DIEZ_DIGITOS = { args: /^\d{10}$/, msg: 'El teléfono debe tener 10 dígitos' };

// La fecha de nacimiento debe corresponder a una persona mayor de 18 años
const esMayorDeEdad = (valor) => {
    const nacimiento = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) throw new Error('La fecha de nacimiento no es válida');

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setFullYear(limite.getFullYear() - 18);
    if (nacimiento > limite) throw new Error('La persona debe ser mayor de 18 años');
};

const Persona = sequelize.define('Persona', {
    idpersona: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    documento: {
        type: DataTypes.STRING(20),
        allowNull: false, // único: ver "indexes" abajo
        validate: {
            notNull: { msg: 'El documento es obligatorio' },
            is: { args: /^\d{5,15}$/, msg: 'El documento debe tener entre 5 y 15 dígitos' }
        }
    },
    nom1: { type: DataTypes.STRING(50), allowNull: false, validate: { notNull: { msg: 'El primer nombre es obligatorio' } } },
    nom2: { type: DataTypes.STRING(50), allowNull: true },
    apell1: { type: DataTypes.STRING(50), allowNull: false, validate: { notNull: { msg: 'El primer apellido es obligatorio' } } },
    apell2: { type: DataTypes.STRING(50), allowNull: true },
    direccion: { type: DataTypes.STRING(150), allowNull: false, validate: { notNull: { msg: 'La dirección es obligatoria' } } },
    tele: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: { is: DIEZ_DIGITOS }
    },
    movil: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { notNull: { msg: 'El celular es obligatorio' }, is: DIEZ_DIGITOS }
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNull: true, // único: ver "indexes" abajo
        validate: { isEmail: { msg: 'El correo no tiene un formato válido' } }
    },
    fecha_nac: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { notNull: { msg: 'La fecha de nacimiento es obligatoria' }, esMayorDeEdad }
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'persona',
    // Índices únicos con nombre fijo: sync({ alter: true }) los crea si faltan y no los duplica
    indexes: [
        { name: 'uq_persona_documento', unique: true, fields: ['documento'] },
        { name: 'correo', unique: true, fields: ['correo'] }
    ]
});

export default Persona;
