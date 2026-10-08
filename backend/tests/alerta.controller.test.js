jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const { listarAlertas, marcarAtendida } = require('../src/controllers/alerta.controller');
const { encolar, reiniciar, crearRes, llamadas } = require('./helpers/mockDb');

beforeEach(() => {
  reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('alerta.controller', () => {
  test('listarAlertas devuelve las alertas con area, dimension y nivel de riesgo', async () => {
    encolar({
      recordset: [{
        id_alerta: 1, nombre_area: 'Area de TI', nombre_dimension: 'Sobrecarga Laboral',
        promedio_calculado: 3.5, n_respondientes: 5, nivel_riesgo: 'ALTO', estado: 'PENDIENTE'
      }]
    });
    const res = crearRes();

    await listarAlertas({}, res);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].nivel_riesgo).toBe('ALTO');
  });

  test('listarAlertas responde 500 si la BD falla', async () => {
    encolar(new Error('fallo'));
    const res = crearRes();

    await listarAlertas({}, res);

    expect(res.statusCode).toBe(500);
  });

  test('marcarAtendida actualiza la alerta indicada a ATENDIDA', async () => {
    const res = crearRes();

    await marcarAtendida({ params: { id: '8' } }, res);

    expect(llamadas[0].texto).toMatch(/UPDATE alerta SET estado = 'ATENDIDA'/);
    expect(llamadas[0].params.id_alerta).toBe('8');
    expect(res.body.mensaje).toMatch(/atendida/i);
  });

  test('marcarAtendida responde 500 si la BD falla', async () => {
    encolar(new Error('fallo'));
    const res = crearRes();

    await marcarAtendida({ params: { id: '8' } }, res);

    expect(res.statusCode).toBe(500);
  });
});
