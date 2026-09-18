const { sql, getPool } = require('../config/db');

async function listarAlertas(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT al.id_alerta, ar.nombre_area, d.nombre_dimension,
             al.promedio_calculado, al.n_respondientes, al.nivel_riesgo,
             cr.texto_recomendacion, al.estado, al.fecha_generacion
      FROM alerta al
      JOIN area ar ON ar.id_area = al.id_area
      JOIN dimension d ON d.id_dimension = al.id_dimension
      LEFT JOIN catalogo_recomendacion cr ON cr.id_recomendacion = al.id_recomendacion
      ORDER BY al.fecha_generacion DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar las alertas' });
  }
}

async function marcarAtendida(req, res) {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id_alerta', sql.Int, id)
      .query(`UPDATE alerta SET estado = 'ATENDIDA' WHERE id_alerta = @id_alerta`);
    res.json({ mensaje: 'Alerta marcada como atendida' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la alerta' });
  }
}

module.exports = { listarAlertas, marcarAtendida };
