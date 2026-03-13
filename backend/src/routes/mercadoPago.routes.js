import express from 'express';
import { crearPreferencia } from '../controllers/mercadoPago.controller.js';

const router = express.Router();

router.post('/crear-preferencia', crearPreferencia);

export default router;