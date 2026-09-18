import { useEffect, useState } from 'react';
import api from '../api/client';

export default function PanelAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await api.get('/alertas');
    setAlertas(data);
    setCargando(false);
  }

  async function atender(id) {
    await api.put(`/alertas/${id}/atender`);
    cargar();
  }

  if (cargando) return <p>Cargando alertas...</p>;

  return (
    <div>
      <h2>Panel de Alertas Tempranas</h2>
      {alertas.length === 0 && <p>No hay alertas registradas.</p>}

      {alertas.map((a) => (
        <div key={a.id_alerta} className={`tarjeta alerta-${a.nivel_riesgo.toLowerCase()}`}>
          <h3>{a.nombre_area} — {a.nombre_dimension}</h3>
          <p>
            Nivel de riesgo: <strong>{a.nivel_riesgo}</strong> (promedio {a.promedio_calculado}, n={a.n_respondientes})
          </p>
          <p>{a.texto_recomendacion}</p>
          <p>Estado: {a.estado}</p>
          {a.estado === 'ACTIVA' && (
            <button onClick={() => atender(a.id_alerta)}>Marcar como atendida</button>
          )}
        </div>
      ))}
    </div>
  );
}
