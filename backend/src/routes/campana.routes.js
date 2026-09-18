const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const {
  crearCampana,
  listarCampanas,
  obtenerPreguntas,
  obtenerOCrearToken,
  cerrarCampana
} = require('../controllers/campana.controller');

router.post('/', verificarToken(['TI']), crearCampana);
router.get('/', verificarToken(), listarCampanas);
router.get('/:id/preguntas', verificarToken(), obtenerPreguntas);
router.post('/:id/token', verificarToken(), obtenerOCrearToken);
router.post('/:id/cerrar', verificarToken(['TI']), cerrarCampana);

module.exports = router;
