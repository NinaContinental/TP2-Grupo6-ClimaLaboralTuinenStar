/**
 * Doble de prueba (mock) del modulo src/config/db.js.
 *
 * Permite probar los controladores SIN SQL Server: cada llamada a
 * request().query() / execute() devuelve la siguiente respuesta que el
 * test haya dejado en la cola (o lanza el Error que se haya encolado).
 * Asi las pruebas son rapidas, repetibles e independientes del estado
 * de la base de datos (principios F.I.R.S.T. de la Unidad 2).
 */
const cola = [];
const llamadas = [];

function siguiente() {
  const item = cola.shift();
  if (item instanceof Error) throw item;
  return item === undefined ? { recordset: [] } : item;
}

function nuevoRequest() {
  const params = {};
  const req = {
    input(nombre, _tipo, valor) {
      params[nombre] = valor;
      return req;
    },
    async query(texto) {
      llamadas.push({ tipo: 'query', texto, params: { ...params } });
      return siguiente();
    },
    async execute(nombre) {
      llamadas.push({ tipo: 'sp', texto: nombre, params: { ...params } });
      return siguiente();
    }
  };
  return req;
}

// sql.Transaction / sql.Request como los usa respuesta.controller.js
class Transaction {
  constructor() {
    this.begin = jest.fn().mockResolvedValue(undefined);
    this.commit = jest.fn().mockResolvedValue(undefined);
    this.rollback = jest.fn().mockResolvedValue(undefined);
    Transaction.ultima = this;
  }
}

function Request() {
  return nuevoRequest();
}

const tipos = {
  Int: 'Int',
  VarChar: 'VarChar',
  Date: 'Date',
  SmallInt: 'SmallInt',
  UniqueIdentifier: 'UniqueIdentifier'
};

const pool = { request: () => nuevoRequest() };

const dbMock = {
  sql: { ...tipos, Transaction, Request },
  getPool: async () => pool
};

/** Encola las respuestas que devolvera la BD simulada, en orden. */
function encolar(...respuestas) {
  cola.push(...respuestas);
}

/** Limpia cola y registro de llamadas (se usa en beforeEach). */
function reiniciar() {
  cola.length = 0;
  llamadas.length = 0;
  Transaction.ultima = null;
}

/** Objeto res de Express minimo para inspeccionar status/json. */
function crearRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(codigo) {
      res.statusCode = codigo;
      return res;
    },
    json(cuerpo) {
      res.body = cuerpo;
      return res;
    }
  };
  return res;
}

module.exports = { dbMock, encolar, reiniciar, crearRes, llamadas, Transaction };
