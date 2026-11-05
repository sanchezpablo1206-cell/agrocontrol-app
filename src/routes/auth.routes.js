import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', autenticar, me);

export default router;