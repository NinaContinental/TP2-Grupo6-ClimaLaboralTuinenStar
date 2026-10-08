jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { encolar, reiniciar } = require('./helpers/mockDb');

function tokenDe(rol) {
  const t = jwt.sign({ id_usuario: 1, rol }, process.env.JWT_SECRET);
  return `Bearer ${t}`;
}

beforeEach(() => {
  reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Rutas HTTP y control de acceso por rol (supertest)', () => {
  test('GET /api/health responde {estado: "ok"}', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ estado: 'ok' });
  });

  test('POST /api/auth/login sin cuerpo responde 400', async () => {
    const r = await request(app).post('/api/auth/login').send({});
    expect(r.status).toBe(400);
  });

  test('rutas protegidas sin token responden 401', async () => {
    const r = await request(app).get('/api/campanas');
    expect(r.status).toBe(401);
  });

  test('un DOCENTE no puede crear campanas (403)', async () => {
    const r = await request(app)
      .post('/api/campanas')
      .set('Authorization', tokenDe('DOCENTE'))
      .send({ titulo: 'X' });
    expect(r.status).toBe(403);
  });

  test('un DOCENTE no puede cerrar campanas (403)', async () => {
    const r = await request(app)
      .post('/api/campanas/1/cerrar')
      .set('Authorization', tokenDe('DOCENTE'));
    expect(r.status).toBe(403);
  });

  test('un DOCENTE no puede ver el dashboard ni las alertas (403)', async () => {
    const dash = await request(app)
      .get('/api/reportes/dashboard/1')
      .set('Authorization', tokenDe('DOCENTE'));
    const alertas = await request(app)
      .get('/api/alertas')
      .set('Authorization', tokenDe('DOCENTE'));
    expect(dash.status).toBe(403);
    expect(alertas.status).toBe(403);
  });

  test('RRHH si puede ver el dashboard (200)', async () => {
    encolar({ recordset: [] });
    const r = await request(app)
      .get('/api/reportes/dashboard/1')
      .set('Authorization', tokenDe('RRHH'));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  test('TI si puede crear campanas (201)', async () => {
    encolar({ recordset: [{ id_campana: 9 }] });
    const r = await request(app)
      .post('/api/campanas')
      .set('Authorization', tokenDe('TI'))
      .send({
        titulo: 'Nueva', id_instrumento: 1,
        fecha_inicio: '2026-10-01', fecha_fin: '2026-10-31'
      });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ id_campana: 9 });
  });
});
