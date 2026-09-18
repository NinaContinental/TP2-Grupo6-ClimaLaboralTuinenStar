const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/db');

async function login(req, res) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contrasena son requeridos' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query(`
        SELECT u.id_usuario, u.nombre_completo, u.contrasena_hash,
               r.nombre_rol, u.estado
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.correo = @correo
      `);

    const usuario = result.recordset[0];
    if (!usuario || usuario.estado !== 'ACTIVO') {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, rol: usuario.nombre_rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.nombre_rol
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
}

module.exports = { login };
