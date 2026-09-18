const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT y, opcionalmente, restringe el acceso
 * a una lista de roles permitidos (ej: ['RRHH', 'GERENCIA']).
 */
function verificarToken(rolesPermitidos = []) {
  return (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = header.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = payload;

      if (rolesPermitidos.length && !rolesPermitidos.includes(payload.rol)) {
        return res.status(403).json({ error: 'No tiene permisos para esta accion' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalido o expirado' });
    }
  };
}

module.exports = { verificarToken };
