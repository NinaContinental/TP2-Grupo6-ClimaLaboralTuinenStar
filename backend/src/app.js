require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const campanaRoutes = require('./routes/campana.routes');
const respuestaRoutes = require('./routes/respuesta.routes');
const alertaRoutes = require('./routes/alerta.routes');
const reporteRoutes = require('./routes/reporte.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/campanas', campanaRoutes);
app.use('/api/respuestas', respuestaRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/reportes', reporteRoutes);

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));

module.exports = app;
