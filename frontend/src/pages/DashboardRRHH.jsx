import { useState } from 'react';
import api from '../api/client';

export default function DashboardRRHH() {
  const [idCampana, setIdCampana] = useState('1');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  async function consultar() {
    setError('');
    setDatos(null);
    try {
      const { data } = await api.get(`/reportes/dashboard/${idCampana}`);
      setDatos(data);
    } catch (err) {
      setError('No se pudo obtener el dashboard');
    }
  }

  function descargar(formato) {
    const token = localStorage.getItem('token');
    const url = `http://localhost:4000/api/reportes/exportar/${formato}/${idCampana}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_campana_${idCampana}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
        link.click();
      });
  }

  return (
    <div>
      <h2>Dashboard de Clima Laboral (RRHH)</h2>

      <div className="tarjeta">
        <label>ID de campana: </label>
        <input
          value={idCampana}
          onChange={(e) => setIdCampana(e.target.value)}
          style={{ width: '60px', marginRight: '8px' }}
        />
        <button onClick={consultar}>Consultar</button>
        <button onClick={() => descargar('excel')}>Exportar Excel</button>
        <button onClick={() => descargar('pdf')}>Exportar PDF</button>
      </div>

      {error && <p className="error">{error}</p>}

      {datos && (
        <table className="tabla-dashboard">
          <thead>
            <tr>
              <th>Area</th>
              <th>Dimension</th>
              <th>Promedio</th>
              <th>N Respondientes</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, i) => (
              <tr key={i}>
                <td>{fila.nombre_area}</td>
                <td>{fila.nombre_dimension}</td>
                <td>{fila.promedio}</td>
                <td>{fila.n_respondientes}</td>
              </tr>
            ))}
            {datos.length === 0 && (
              <tr>
                <td colSpan="4">Sin cortes con al menos 5 respondientes todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p className="nota-anonimato">
        Datos agregados y anonimizados. Cortes con menos de 5 respondientes se omiten.
      </p>
    </div>
  );
}
