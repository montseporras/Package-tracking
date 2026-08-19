// Rutas REST de pedidos.
import { Router } from 'express';
import {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  duplicar,
  eliminar,
  resumen,
} from '../controllers/pedidosController.js';
import { validarPedido } from '../middleware/validarPedido.js';

const router = Router();

router.get('/stats/resumen', resumen); // debe ir antes de '/:id'
router.get('/', listar);
router.get('/:id', obtener);
router.post('/', validarPedido, crear);
router.put('/:id', validarPedido, actualizar);
router.patch('/:id/estado', cambiarEstado);
router.post('/:id/duplicar', duplicar);
router.delete('/:id', eliminar);

export default router;
