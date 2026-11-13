import { Router } from 'express';
import * as ctrl from '../controllers/lote.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

// Cada productor gestiona sus propios lotes (el admin ve todos)
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;
