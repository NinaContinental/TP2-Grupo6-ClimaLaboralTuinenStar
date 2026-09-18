const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const { listarAlertas, marcarAtendida } = require('../controllers/alerta.controller');

router.get('/', verificarToken(['RRHH', 'GERENCIA']), listarAlertas);
router.put('/:id/atender', verificarToken(['RRHH', 'GERENCIA']), marcarAtendida);

module.exports = router;
