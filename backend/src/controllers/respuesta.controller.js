const { sql, getPool } = require('../config/db');

/**
 * Recibe: { id_token, respuestas: [{ id_pregunta, valor_respuesta }] }
 * Nunca recibe ni guarda id_usuario: solo el id_token anonimo.
 */
async function enviarRespuestas(req, res) {
  const { id_token, respuestas } = req.body;

  if (!id_token || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const r of respuestas) {
        await new sql.Request(transaction)
          .input('id_pregunta', sql.Int, r.id_pregunta)
          .input('id_token', sql.UniqueIdentifier, id_token)
          .input('valor_respuesta', sql.SmallInt, r.valor_respuesta)
          .query(`
            INSERT INTO respuesta (id_pregunta, id_token, valor_respuesta)
            VALUES (@id_pregunta, @id_token, @valor_respuesta)
          `);
      }

      await transaction.commit();
      res.json({ mensaje: 'Respuestas registradas de forma anonima' });
    } catch (errInterno) {
      await transaction.rollback();
      throw errInterno;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar las respuestas' });
  }
}

module.exports = { enviarRespuestas };
