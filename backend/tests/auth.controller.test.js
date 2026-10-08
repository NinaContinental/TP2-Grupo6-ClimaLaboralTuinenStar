jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { login } = require('../src/controllers/auth.controller');
const { encolar, reiniciar, crearRes, llamadas } = require('./helpers/mockDb');

describe('auth.controller - login', () => {
  let hash;

  beforeAll(async () => {
    // costo 4 = rapido en pruebas; en produccion se usa el costo por defecto
    hash = await bcrypt.hash('Docente123!', 4);
  });

  beforeEach(() => {
    reiniciar();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('responde 400 si falta el correo o la contrasena', async () => {
    const res = crearRes();
    await login({ body: { correo: 'a@test.com' } }, res);
    expect(res.statusCode).toBe(400);

    const res2 = crearRes();
    await login({ body: { contrasena: 'x' } }, res2);
    expect(res2.statusCode).toBe(400);
    expect(llamadas).toHaveLength(0); // ni siquiera consulta la BD
  });

  test('responde 401 si el usuario no existe', async () => {
    encolar({ recordset: [] });
    const res = crearRes();

    await login({ body: { correo: 'noexiste@test.com', contrasena: 'x' } }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credenciales invalidas');
  });

  test('responde 401 si el usuario esta INACTIVO aunque la clave sea correcta', async () => {
    encolar({
      recordset: [{
        id_usuario: 1, nombre_completo: 'Inactivo', contrasena_hash: hash,
        nombre_rol: 'DOCENTE', estado: 'INACTIVO'
      }]
    });
    const res = crearRes();

    await login({ body: { correo: 'x@test.com', contrasena: 'Docente123!' } }, res);

    expect(res.statusCode).toBe(401);
  });

  test('responde 401 si la contrasena es incorrecta', async () => {
    encolar({
      recordset: [{
        id_usuario: 1, nombre_completo: 'Docente Uno', contrasena_hash: hash,
        nombre_rol: 'DOCENTE', estado: 'ACTIVO'
      }]
    });
    const res = crearRes();

    await login({ body: { correo: 'docente1.prueba@test.com', contrasena: 'incorrecta' } }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('con credenciales correctas devuelve un JWT valido con id_usuario y rol', async () => {
    encolar({
      recordset: [{
        id_usuario: 12, nombre_completo: 'Docente Uno', contrasena_hash: hash,
        nombre_rol: 'DOCENTE', estado: 'ACTIVO'
      }]
    });
    const res = crearRes();

    await login({ body: { correo: 'docente1.prueba@test.com', contrasena: 'Docente123!' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.nombre_completo).toBe('Docente Uno');
    expect(res.body.rol).toBe('DOCENTE');

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.id_usuario).toBe(12);
    expect(payload.rol).toBe('DOCENTE');
    expect(payload.exp - payload.iat).toBe(30 * 60); // vence en 30 minutos
  });

  test('nunca devuelve el hash de la contrasena en la respuesta', async () => {
    encolar({
      recordset: [{
        id_usuario: 12, nombre_completo: 'Docente Uno', contrasena_hash: hash,
        nombre_rol: 'DOCENTE', estado: 'ACTIVO'
      }]
    });
    const res = crearRes();

    await login({ body: { correo: 'docente1.prueba@test.com', contrasena: 'Docente123!' } }, res);

    expect(JSON.stringify(res.body)).not.toContain(hash);
  });

  test('responde 500 si la base de datos falla', async () => {
    encolar(new Error('fallo de conexion'));
    const res = crearRes();

    await login({ body: { correo: 'a@test.com', contrasena: 'x' } }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error al iniciar sesion');
  });
});
