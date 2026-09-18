const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { sql, getPool } = require('../config/db');

/**
 * Consulta agregada reutilizable: promedio por area+dimension,
 * excluyendo cualquier corte con menos de 5 respondientes
 * (misma regla de k-anonimato que aplica sp_generar_alertas).
 */
// Nota: agrupa por token_anonimo.id_area (no por usuario.id_area) para
// que el reporte siga funcionando incluso despues de anonimizar la
// campana, cuando token_anonimo.id_usuario ya quedo en NULL.
async function obtenerAgregadoPorCampana(pool, id_campana) {
  const result = await pool.request()
    .input('id_campana', sql.Int, id_campana)
    .query(`
      SELECT ar.nombre_area, d.nombre_dimension,
             AVG(CAST(resp.valor_respuesta AS DECIMAL(4,2))) AS promedio,
             COUNT(DISTINCT t.id_token) AS n_respondientes
      FROM respuesta resp
      JOIN pregunta p      ON p.id_pregunta = resp.id_pregunta
      JOIN token_anonimo t ON t.id_token = resp.id_token
      JOIN area ar         ON ar.id_area = t.id_area
      JOIN dimension d     ON d.id_dimension = p.id_dimension
      WHERE t.id_campana = @id_campana
      GROUP BY ar.nombre_area, d.nombre_dimension
      HAVING COUNT(DISTINCT t.id_token) >= 5
    `);
  return result.recordset;
}

async function obtenerDashboard(req, res) {
  const { id_campana } = req.params;
  try {
    const pool = await getPool();
    const datos = await obtenerAgregadoPorCampana(pool, id_campana);
    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
}

async function exportarExcel(req, res) {
  const { id_campana } = req.params;
  try {
    const pool = await getPool();
    const datos = await obtenerAgregadoPorCampana(pool, id_campana);

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Clima Laboral');

    hoja.columns = [
      { header: 'Area', key: 'nombre_area', width: 25 },
      { header: 'Dimension', key: 'nombre_dimension', width: 25 },
      { header: 'Promedio', key: 'promedio', width: 12 },
      { header: 'N Respondientes', key: 'n_respondientes', width: 18 }
    ];
    hoja.addRows(datos);
    hoja.addRow([]);
    hoja.addRow(['Datos agregados. Cortes con menos de 5 respondientes se omiten.']);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_campana_${id_campana}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar a Excel' });
  }
}

async function exportarPDF(req, res) {
  const { id_campana } = req.params;
  try {
    const pool = await getPool();
    const datos = await obtenerAgregadoPorCampana(pool, id_campana);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_campana_${id_campana}.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text('Reporte de Clima Laboral - Instituto Tuinen Star', { align: 'center' });
    doc.moveDown();

    datos.forEach((fila) => {
      doc.fontSize(11).text(
        `${fila.nombre_area} | ${fila.nombre_dimension} | Promedio: ${fila.promedio} | N: ${fila.n_respondientes}`
      );
    });

    doc.moveDown();
    doc.fontSize(9).fillColor('gray').text(
      'Datos agregados y anonimizados. Cortes con menos de 5 respondientes se omiten.'
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar a PDF' });
  }
}

module.exports = { obtenerDashboard, exportarExcel, exportarPDF };
