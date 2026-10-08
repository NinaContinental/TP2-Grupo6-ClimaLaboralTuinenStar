const jwt = require('jsonwebtoken');
const { verificarToken } = require('../src/middleware/auth.middleware');
const { crearRes } = require('./helpers/mockDb');

function firmar(payload, opciones = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, opciones);
}

describe('verificarToken (middleware de autenticacion y roles)', () => {
  test('responde 401 si no se envia el header Authorization', () => {
    const req = { headers: {} };
    const res = crearRes();
    const next = jest.fn();

    verificarToken()(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token no proporcionado');
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si el token es invalido', () => {
    const req = { headers: { authorization: 'Bearer token-falso' } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken()(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si el token esta expirado', () => {
    const token = firmar({ id_usuario: 1, rol: 'DOCENTE' }, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken()(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token invalido o expirado');
  });

  test('responde 401 si el token fue firmado con otro secreto', () => {
    const token = jwt.sign({ id_usuario: 1, rol: 'TI' }, 'otro-secreto');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken()(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('con token valido y sin restriccion de rol llama a next y llena req.usuario', () => {
    const token = firmar({ id_usuario: 7, rol: 'DOCENTE' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.usuario.id_usuario).toBe(7);
    expect(req.usuario.rol).toBe('DOCENTE');
  });

  test('responde 403 si el rol no esta en la lista permitida', () => {
    const token = firmar({ id_usuario: 7, rol: 'DOCENTE' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken(['RRHH', 'GERENCIA'])(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite el paso si el rol esta en la lista permitida', () => {
    const token = firmar({ id_usuario: 3, rol: 'RRHH' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    const next = jest.fn();

    verificarToken(['RRHH', 'GERENCIA'])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
