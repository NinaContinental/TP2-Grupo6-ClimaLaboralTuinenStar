jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const { enviarRespuestas } = require('../src/controllers/respuesta.controller');
const { encolar, reiniciar, crearRes, llamadas, Transaction } = require('./helpers/mockDb');

const TOKEN = '3F2504E0-4F89-11D3-9A0C-0305E82C3301';

beforeEach(() => {
  reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('respuesta.controller - enviarRespuestas', () => {
  test('responde 400 si falta el id_token', async () => {
    const res = crearRes();
    await enviarRespuestas({ body: { respuestas: [{ id_pregunta: 1, valor_respuesta: 3 }] } }, res);
    expect(res.statusCode).toBe(400);
  });

  test('responde 400 si respuestas no es un arreglo', async () => {
    const res = crearRes();
    await enviarRespuestas({ body: { id_token: TOKEN, respuestas: 'hola' } }, res);
    expect(res.statusCode).toBe(400);
  });

  test('responde 400 si el arreglo de respuestas viene vacio', async () => {
    const res = crearRes();
    await enviarRespuestas({ body: { id_token: TOKEN, respuestas: [] } }, res);
    expect(res.statusCode).toBe(400);
    expect(llamadas).toHaveLength(0);
  });

  test('inserta cada respuesta y confirma la transaccion (commit)', async () => {
    const respuestas = [
      { id_pregunta: 1, valor_respuesta: 4 },
      { id_pregunta: 2, valor_respuesta: 3 },
      { id_pregunta: 3, valor_respuesta: 5 }
    ];
    const res = crearRes();

    await enviarRespuestas({ body: { id_token: TOKEN, respuestas } }, res);

    expect(res.statusCode).toBe(200);
    expect(llamadas).toHaveLength(3);
    expect(Transaction.ultima.begin).toHaveBeenCalledTimes(1);
    expect(Transaction.ultima.commit).toHaveBeenCalledTimes(1);
    expect(Transaction.ultima.rollback).not.toHaveBeenCalled();
  });

  test('ANONIMATO: ninguna insercion lleva id_usuario, solo el token', async () => {
    const respuestas = [{ id_pregunta: 1, valor_respuesta: 4 }];
    // aunque el cliente intente colar un id_usuario en el cuerpo, se ignora
    const body = { id_token: TOKEN, id_usuario: 99, respuestas };

    await enviarRespuestas({ body }, crearRes());

    for (const l of llamadas) {
      expect(Object.keys(l.params)).not.toContain('id_usuario');
      expect(l.texto).not.toMatch(/id_usuario/);
      expect(l.params.id_token).toBe(TOKEN);
    }
  });

  test('si una insercion falla hace rollback, no commit, y responde 500', async () => {
    encolar({ recordset: [] }, new Error('violacion de restriccion'));
    const respuestas = [
      { id_pregunta: 1, valor_respuesta: 4 },
      { id_pregunta: 2, valor_respuesta: 9 }
    ];
    const res = crearRes();

    await enviarRespuestas({ body: { id_token: TOKEN, respuestas } }, res);

    expect(res.statusCode).toBe(500);
    expect(Transaction.ultima.rollback).toHaveBeenCalledTimes(1);
    expect(Transaction.ultima.commit).not.toHaveBeenCalled();
  });
});
