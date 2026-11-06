import { sequelize, sincronizarTablas } from '../models/index.js'; // los modelos y relaciones se cargan antes de sincronizar

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL exitosa');

    await sincronizarTablas();
    console.log('✅ Tablas sincronizadas');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};