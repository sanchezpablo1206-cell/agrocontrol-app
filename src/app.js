import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/connection.js';
import { crearAdmin } from './seeders/admin.seed.js';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '3mb' })); // imágenes de hasta 2 MB en base64
app.use(express.static('public'));
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'AgroControl API funcionando' });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  await crearAdmin();
  app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
};

start();