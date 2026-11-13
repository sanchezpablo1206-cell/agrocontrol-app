import { Router } from 'express';
import authRoutes from './auth.routes.js';
import perfilRoutes from './perfil.routes.js';
import personaRoutes from './persona.routes.js';
import usuarioRoutes from './usuario.routes.js';
import tipoGastoRoutes from './tipogasto.routes.js';
import gastoRoutes from './gasto.routes.js';
import loteRoutes from './lote.routes.js';
import tipoCultivoRoutes from './tipocultivo.routes.js';
import cultivoRoutes from './cultivo.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/perfiles', perfilRoutes);
router.use('/personas', personaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/tipos-gasto', tipoGastoRoutes);
router.use('/gastos', gastoRoutes);
router.use('/lotes', loteRoutes);
router.use('/tipos-cultivo', tipoCultivoRoutes);
router.use('/cultivos', cultivoRoutes);

export default router;