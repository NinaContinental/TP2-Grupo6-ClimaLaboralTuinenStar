const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const { enviarRespuestas } = require('../controllers/respuesta.controller');

// Requiere sesion valida (para saber que el colaborador tiene permiso
// de responder), pero el cuerpo enviado nunca lleva id_usuario.
router.post('/', verificarToken(), enviarRespuestas);

module.exports = router;
