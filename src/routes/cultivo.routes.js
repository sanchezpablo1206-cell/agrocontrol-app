import { Router } from 'express';
import * as ctrl from '../controllers/cultivo.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { procesarImagen } from '../middlewares/imagen.middleware.js';

const router = Router();

// La etiqueta <img> no envía el token, por eso la imagen se sirve sin autenticación
router.get('/:id/imagen', ctrl.imagen);

// Cada productor gestiona los cultivos de sus lotes (el admin ve todos)
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', procesarImagen, ctrl.crear);
router.put('/:id', procesarImagen, ctrl.actualizar);
router.patch('/:id/finalizar', ctrl.finalizar);
router.patch('/:id/habilitar', ctrl.habilitar);
router.delete('/:id', ctrl.eliminar);

export default router;
