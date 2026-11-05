import { Router } from 'express';
import * as ctrl from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('admin'));

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.patch('/:id/estado', ctrl.cambiarEstado);
router.delete('/:id', ctrl.eliminar);

export default router;