import { sequelize } from '../models/index.js'; // importar desde models garantiza que las relaciones ya estén registradas

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL exitosa');

    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};