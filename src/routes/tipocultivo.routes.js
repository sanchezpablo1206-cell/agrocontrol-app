import { Router } from 'express';
import * as ctrl from '../controllers/tipocultivo.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirRoles } from '../middlewares/role.middleware.js';
import { procesarImagen } from '../middlewares/imagen.middleware.js';

const router = Router();

// La etiqueta <img> no envía el token, por eso la imagen se sirve sin autenticación
router.get('/:id/imagen', ctrl.imagen);

router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', permitirRoles('admin'), procesarImagen, ctrl.crear);
router.put('/:id', permitirRoles('admin'), procesarImagen, ctrl.actualizar);
router.delete('/:id', permitirRoles('admin'), ctrl.eliminar);

export default router;
