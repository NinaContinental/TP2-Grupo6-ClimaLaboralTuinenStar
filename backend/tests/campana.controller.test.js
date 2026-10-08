jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const {
  crearCampana,
  listarCampanas,
  obtenerPreguntas,
  obtenerOCrearToken,
  cerrarCampana
} = require('../src/controllers/campana.controller');
const { encolar, reiniciar, crearRes, llamadas } = require('./helpers/mockDb');

beforeEach(() => {
  reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('campana.controller - CRUD de campanas', () => {
  test('crearCampana responde 201 con el id generado y guarda al creador', async () => {
    encolar({ recordset: [{ id_campana: 5 }] });
    const req = {
      body: {
        titulo: 'Clima 2026', descripcion: 'Prueba', id_instrumento: 1,
        fecha_inicio: '2026-10-01', fecha_fin: '2026-10-31'
      },
      usuario: { id_usuario: 1, rol: 'TI' }
    };
    const res = crearRes();

    await crearCampana(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id_campana: 5 });
    expect(llamadas[0].params.id_usuario_creador).toBe(1);
    expect(llamadas[0].params.titulo).toBe('Clima 2026');
  });

  test('crearCampana guarda descripcion NULL cuando no se envia', async () => {
    encolar({ recordset: [{ id_campana: 6 }] });
    const req = {
      body: { titulo: 'X', id_instrumento: 1, fecha_inicio: '2026-10-01', fecha_fin: '2026-10-02' },
      usuario: { id_usuario: 1 }
    };

    await crearCampana(req, crearRes());

    expect(llamadas[0].params.descripcion).toBeNull();
  });

  test('crearCampana responde 500 si la BD falla', async () => {
    encolar(new Error('fallo'));
    const res = crearRes();

    await crearCampana({ body: {}, usuario: { id_usuario: 1 } }, res);

    expect(res.statusCode).toBe(500);
  });

  test('listarCampanas devuelve el listado de la BD', async () => {
    encolar({ recordset: [{ id_campana: 1, titulo: 'A' }, { id_campana: 2, titulo: 'B' }] });
    const res = crearRes();

    await listarCampanas({}, res);

    expect(res.body).toHaveLength(2);
  });

  test('obtenerPreguntas filtra por el id de la campana', async () => {
    encolar({ recordset: [{ id_pregunta: 1, texto_pregunta: 'P1' }] });
    const res = crearRes();

    await obtenerPreguntas({ params: { id: '3' } }, res);

    expect(llamadas[0].params.id_campana).toBe('3');
    expect(res.body[0].texto_pregunta).toBe('P1');
  });
});

describe('campana.controller - obtenerOCrearToken (token anonimo)', () => {
  const req = { params: { id: '1' }, usuario: { id_usuario: 10 } };

  test('si el usuario ya tiene token lo devuelve sin insertar otro', async () => {
    encolar({ recordset: [{ id_token: 'TOKEN-EXISTENTE' }] });
    const res = crearRes();

    await obtenerOCrearToken(req, res);

    expect(res.body).toEqual({ id_token: 'TOKEN-EXISTENTE' });
    expect(llamadas).toHaveLength(1); // solo el SELECT inicial
  });

  test('si no tiene token crea uno guardando el id_area del usuario', async () => {
    encolar(
      { recordset: [] },                        // no hay token previo
      { recordset: [{ id_area: 4 }] },          // area del usuario
      { recordset: [{ id_token: 'TOKEN-NUEVO' }] } // INSERT ... OUTPUT
    );
    const res = crearRes();

    await obtenerOCrearToken(req, res);

    expect(res.body).toEqual({ id_token: 'TOKEN-NUEVO' });
    const insert = llamadas[2];
    expect(insert.texto).toMatch(/INSERT INTO token_anonimo/);
    expect(insert.params.id_area).toBe(4);
  });

  test.each([2627, 2601])(
    'ante colision de clave unica (%i) recupera el token ya creado en vez de fallar',
    async (numero) => {
      const colision = Object.assign(new Error('duplicado'), { number: numero });
      encolar(
        { recordset: [] },
        { recordset: [{ id_area: 4 }] },
        colision,
        { recordset: [{ id_token: 'TOKEN-DE-LA-OTRA-PETICION' }] }
      );
      const res = crearRes();

      await obtenerOCrearToken(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id_token: 'TOKEN-DE-LA-OTRA-PETICION' });
    }
  );

  test('un error de BD distinto a duplicado responde 500', async () => {
    const otroError = Object.assign(new Error('timeout'), { number: 1205 });
    encolar({ recordset: [] }, { recordset: [{ id_area: 4 }] }, otroError);
    const res = crearRes();

    await obtenerOCrearToken(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error al generar el token anonimo');
  });
});

describe('campana.controller - cerrarCampana', () => {
  test('ejecuta en orden: generar alertas -> marcar CERRADA -> anonimizar', async () => {
    const res = crearRes();

    await cerrarCampana({ params: { id: '1' } }, res);

    expect(llamadas).toHaveLength(3);
    expect(llamadas[0]).toMatchObject({ tipo: 'sp', texto: 'sp_generar_alertas' });
    expect(llamadas[1].texto).toMatch(/UPDATE campana_encuesta SET estado = 'CERRADA'/);
    expect(llamadas[2]).toMatchObject({ tipo: 'sp', texto: 'sp_anonimizar_campana' });
    expect(res.statusCode).toBe(200);
  });

  test('si falla la generacion de alertas NO anonimiza ni cierra', async () => {
    encolar(new Error('fallo en sp_generar_alertas'));
    const res = crearRes();

    await cerrarCampana({ params: { id: '1' } }, res);

    expect(res.statusCode).toBe(500);
    expect(llamadas.map((l) => l.texto)).not.toContain('sp_anonimizar_campana');
    expect(llamadas).toHaveLength(1);
  });
});
