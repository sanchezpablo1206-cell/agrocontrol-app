import { Router } from 'express';
import authRoutes from './auth.routes.js';
import perfilRoutes from './perfil.routes.js';
import personaRoutes from './persona.routes.js';
import usuarioRoutes from './usuario.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/perfiles', perfilRoutes);
router.use('/personas', personaRoutes);
router.use('/usuarios', usuarioRoutes);

export default router;