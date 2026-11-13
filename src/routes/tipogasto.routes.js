import { Router } from 'express';
import * as ctrl from '../controllers/tipogasto.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', permitirRoles('admin'), ctrl.crear);
router.put('/:id', permitirRoles('admin'), ctrl.actualizar);
router.delete('/:id', permitirRoles('admin'), ctrl.eliminar);

export default router;
