import { Router } from 'express';
import * as ctrl from '../controllers/persona.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.use(autenticar);

// Cualquier usuario consulta y modifica sus propios datos (va antes de /:id)
router.get('/mi-perfil', ctrl.miPerfil);
router.put('/mi-perfil', ctrl.actualizarMiPerfil);

// Gestión de personas: solo administrador
router.get('/', permitirRoles('admin'), ctrl.listar);
router.get('/:id', permitirRoles('admin'), ctrl.obtener);
router.post('/', permitirRoles('admin'), ctrl.crear);
router.put('/:id', permitirRoles('admin'), ctrl.actualizar);
router.delete('/:id', permitirRoles('admin'), ctrl.eliminar);

export default router;
