jest.mock('../src/config/db', () => require('./helpers/mockDb').dbMock);

const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const {
  obtenerDashboard,
  exportarExcel,
  exportarPDF
} = require('../src/controllers/reporte.controller');
const { encolar, reiniciar, crearRes, llamadas } = require('./helpers/mockDb');

const FILAS = [
  { nombre_area: 'Area de TI', nombre_dimension: 'Sobrecarga Laboral', promedio: 3.5, n_respondientes: 5 }
];

/** res que ademas es un stream escribible, para capturar Excel/PDF. */
function crearResStream() {
  const res = new PassThrough();
  res.cabeceras = {};
  res.setHeader = (k, v) => { res.cabeceras[k] = v; };
  res.statusCode = 200;
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.chunks = [];
  res.on('data', (c) => res.chunks.push(c));
  res.terminado = new Promise((resolve) => res.on('end', resolve));
  return res;
}

beforeEach(() => {
  reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('reporte.controller - dashboard', () => {
  test('devuelve los promedios por area y dimension', async () => {
    encolar({ recordset: FILAS });
    const res = crearRes();

    await obtenerDashboard({ params: { id_campana: '1' } }, res);

    expect(res.body).toEqual(FILAS);
    expect(llamadas[0].params.id_campana).toBe('1');
  });

  test('K-ANONIMATO: la consulta exige al menos 5 respondientes por corte', async () => {
    await obtenerDashboard({ params: { id_campana: '1' } }, crearRes());

    expect(llamadas[0].texto).toMatch(/HAVING COUNT\(DISTINCT t\.id_token\) >= 5/);
  });

  test('ANONIMATO: agrupa por el area del token, no por el usuario', async () => {
    await obtenerDashboard({ params: { id_campana: '1' } }, crearRes());

    expect(llamadas[0].texto).toMatch(/ar\.id_area = t\.id_area/);
    expect(llamadas[0].texto).not.toMatch(/JOIN usuario/i);
  });

  test('responde 500 si la BD falla', async () => {
    encolar(new Error('fallo'));
    const res = crearRes();

    await obtenerDashboard({ params: { id_campana: '1' } }, res);

    expect(res.statusCode).toBe(500);
  });
});

describe('reporte.controller - exportaciones', () => {
  test('exportarExcel genera un .xlsx valido con las filas y el aviso de anonimato', async () => {
    encolar({ recordset: FILAS });
    const res = crearResStream();

    await exportarExcel({ params: { id_campana: '1' } }, res);
    await res.terminado;

    expect(res.cabeceras['Content-Disposition']).toContain('reporte_campana_1.xlsx');

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(Buffer.concat(res.chunks));
    const hoja = libro.getWorksheet('Clima Laboral');
    expect(hoja.getRow(1).getCell(1).value).toBe('Area');
    expect(hoja.getRow(2).getCell(1).value).toBe('Area de TI');
    expect(hoja.getRow(2).getCell(3).value).toBe(3.5);
    expect(hoja.getRow(4).getCell(1).value).toMatch(/menos de 5 respondientes/);
  });

  test('exportarPDF genera un PDF valido', async () => {
    encolar({ recordset: FILAS });
    const res = crearResStream();

    await exportarPDF({ params: { id_campana: '1' } }, res);
    await res.terminado;

    expect(res.cabeceras['Content-Type']).toBe('application/pdf');
    const contenido = Buffer.concat(res.chunks);
    expect(contenido.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('exportarExcel responde 500 si la BD falla', async () => {
    encolar(new Error('fallo'));
    const res = crearResStream();

    await exportarExcel({ params: { id_campana: '1' } }, res);

    expect(res.statusCode).toBe(500);
  });
});
