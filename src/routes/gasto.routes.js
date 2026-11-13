import { Router } from 'express';
import * as ctrl from '../controllers/gasto.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

// Cualquier usuario autenticado gestiona sus propios gastos (el admin ve todos)
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;
