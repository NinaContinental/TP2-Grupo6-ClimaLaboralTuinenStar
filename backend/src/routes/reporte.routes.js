const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const {
  obtenerDashboard,
  exportarExcel,
  exportarPDF
} = require('../controllers/reporte.controller');

router.get('/dashboard/:id_campana', verificarToken(['RRHH', 'GERENCIA']), obtenerDashboard);
router.get('/exportar/excel/:id_campana', verificarToken(['RRHH', 'GERENCIA']), exportarExcel);
router.get('/exportar/pdf/:id_campana', verificarToken(['RRHH', 'GERENCIA']), exportarPDF);

module.exports = router;
