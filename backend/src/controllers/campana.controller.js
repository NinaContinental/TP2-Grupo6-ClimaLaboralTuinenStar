const { sql, getPool } = require('../config/db');

async function crearCampana(req, res) {
  const { titulo, descripcion, id_instrumento, fecha_inicio, fecha_fin } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('titulo', sql.VarChar, titulo)
      .input('descripcion', sql.VarChar, descripcion || null)
      .input('id_instrumento', sql.Int, id_instrumento)
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('fecha_fin', sql.Date, fecha_fin)
      .input('id_usuario_creador', sql.Int, req.usuario.id_usuario)
      .query(`
        INSERT INTO campana_encuesta
          (titulo, descripcion, id_instrumento, fecha_inicio, fecha_fin, id_usuario_creador)
        OUTPUT INSERTED.id_campana
        VALUES (@titulo, @descripcion, @id_instrumento, @fecha_inicio, @fecha_fin, @id_usuario_creador)
      `);

    res.status(201).json({ id_campana: result.recordset[0].id_campana });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la campana' });
  }
}

async function listarCampanas(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT c.id_campana, c.titulo, c.estado, c.fecha_inicio, c.fecha_fin,
             i.nombre_instrumento
      FROM campana_encuesta c
      JOIN instrumento i ON i.id_instrumento = c.id_instrumento
      ORDER BY c.fecha_inicio DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar campanas' });
  }
}

async function obtenerPreguntas(req, res) {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_campana', sql.Int, id)
      .query(`
        SELECT p.id_pregunta, p.texto_pregunta, p.orden, d.nombre_dimension
        FROM pregunta p
        JOIN dimension d ON d.id_dimension = p.id_dimension
        WHERE p.id_campana = @id_campana
        ORDER BY p.orden
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
}

/**
 * El colaborador solicita (o recupera) su token anonimo para
 * poder responder esta campana. Un solo token por (usuario, campana).
 */
async function obtenerOCrearToken(req, res) {
  const { id } = req.params;
  const id_usuario = req.usuario.id_usuario;

  try {
    const pool = await getPool();

    const existente = await pool.request()
      .input('id_usuario', sql.Int, id_usuario)
      .input('id_campana', sql.Int, id)
      .query(`
        SELECT id_token FROM token_anonimo
        WHERE id_usuario = @id_usuario AND id_campana = @id_campana
      `);

    if (existente.recordset.length) {
      return res.json({ id_token: existente.recordset[0].id_token });
    }

    // El area se guarda directo en el token (no solo en usuario) para que
    // el dashboard y las alertas sigan pudiendo agrupar por area incluso
    // despues de anonimizar la campana (cuando id_usuario pasa a NULL).
    const usuarioResp = await pool.request()
      .input('id_usuario', sql.Int, id_usuario)
      .query(`SELECT id_area FROM usuario WHERE id_usuario = @id_usuario`);

    const id_area = usuarioResp.recordset[0].id_area;

    try {
      const nuevo = await pool.request()
        .input('id_usuario', sql.Int, id_usuario)
        .input('id_campana', sql.Int, id)
        .input('id_area', sql.Int, id_area)
        .query(`
          INSERT INTO token_anonimo (id_usuario, id_campana, id_area)
          OUTPUT INSERTED.id_token
          VALUES (@id_usuario, @id_campana, @id_area)
        `);

      return res.json({ id_token: nuevo.recordset[0].id_token });
    } catch (errInsert) {
      // Colision por peticiones casi simultaneas (React StrictMode en
      // desarrollo duplica el efecto, o un doble clic real del usuario).
      // No es un error de verdad: recuperamos el token que ya se creo.
      if (errInsert.number === 2627 || errInsert.number === 2601) {
        const yaCreado = await pool.request()
          .input('id_usuario', sql.Int, id_usuario)
          .input('id_campana', sql.Int, id)
          .query(`
            SELECT id_token FROM token_anonimo
            WHERE id_usuario = @id_usuario AND id_campana = @id_campana
          `);
        if (yaCreado.recordset.length) {
          return res.json({ id_token: yaCreado.recordset[0].id_token });
        }
      }
      throw errInsert;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el token anonimo' });
  }
}

/**
 * Cierra la campana en el orden correcto:
 * 1) genera alertas (todavia con vinculo usuario->area)
 * 2) marca la campana como CERRADA
 * 3) anonimiza (SET NULL en id_usuario de token_anonimo)
 */
async function cerrarCampana(req, res) {
  const { id } = req.params;
  try {
    const pool = await getPool();

    await pool.request().input('id_campana', sql.Int, id)
      .execute('sp_generar_alertas');

    await pool.request().input('id_campana', sql.Int, id).query(`
      UPDATE campana_encuesta SET estado = 'CERRADA' WHERE id_campana = @id_campana
    `);

    await pool.request().input('id_campana', sql.Int, id)
      .execute('sp_anonimizar_campana');

    res.json({ mensaje: 'Campana cerrada: alertas generadas y respuestas anonimizadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cerrar la campana' });
  }
}

module.exports = {
  crearCampana,
  listarCampanas,
  obtenerPreguntas,
  obtenerOCrearToken,
  cerrarCampana
};
