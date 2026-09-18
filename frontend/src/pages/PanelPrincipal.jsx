import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PanelPrincipal() {
  const { usuario } = useAuth();
  const [campanas, setCampanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarCampanas();
  }, []);

  async function cargarCampanas() {
    try {
      const { data } = await api.get('/campanas');
      setCampanas(data);
    } catch (err) {
      setMensaje('No se pudieron cargar las campanas');
    } finally {
      setCargando(false);
    }
  }

  async function cerrarCampana(id) {
    if (!window.confirm('Esto generara alertas y anonimizara las respuestas. Continuar?')) return;
    try {
      const { data } = await api.post(`/campanas/${id}/cerrar`);
      setMensaje(data.mensaje);
      cargarCampanas();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al cerrar la campana');
    }
  }

  return (
    <div>
      <h2>Bienvenido(a), {usuario.nombre}</h2>
      {mensaje && <p className="aviso">{mensaje}</p>}

      {cargando ? (
        <p>Cargando campanas...</p>
      ) : (
        <div>
          {campanas.map((c) => (
            <div key={c.id_campana} className="tarjeta">
              <h3>{c.titulo}</h3>
              <p>{c.nombre_instrumento} — Estado: {c.estado}</p>

              {(usuario.rol === 'DOCENTE' || usuario.rol === 'ADMINISTRATIVO') &&
                c.estado === 'ACTIVA' && (
                  <Link to={`/encuesta/${c.id_campana}`}>
                    <button>Responder encuesta</button>
                  </Link>
                )}

              {usuario.rol === 'TI' && c.estado === 'ACTIVA' && (
                <button onClick={() => cerrarCampana(c.id_campana)}>Cerrar campana</button>
              )}
            </div>
          ))}
          {campanas.length === 0 && <p>No hay campanas registradas todavia.</p>}
        </div>
      )}
    </div>
  );
}
