import { Router } from 'express';
import { login, me, recuperar, restablecer, registro, perfilesRegistro } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', autenticar, me);

router.post('/recuperar', recuperar);
router.post('/restablecer', restablecer);

// Registro público (sin sesión)
router.get('/perfiles-registro', perfilesRegistro);
router.post('/registro', registro);

export default router;
