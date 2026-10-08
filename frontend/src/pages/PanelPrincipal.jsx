import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { InsigniaEstado } from '../components/Insignia';
import { Esqueleto, EstadoVacio, MensajeError } from '../components/Estados';
import { IconoBandeja, IconoCalendario, IconoCampana, IconoGrafico } from '../components/Icons';
import { ETIQUETA_ROL, formatearFecha, primerNombre } from '../lib/riesgo';
import useTitulo from '../lib/useTitulo';

const SUBTITULO = {
  DOCENTE: 'Participa en las campañas activas. Tus respuestas son anónimas.',
  ADMINISTRATIVO: 'Participa en las campañas activas. Tus respuestas son anónimas.',
  RRHH: 'Revisa los resultados de cada campaña y atiende las alertas tempranas.',
  GERENCIA: 'Revisa los resultados de cada campaña y atiende las alertas tempranas.',
  TI: 'Administra las campañas. Al cerrar una, se generan las alertas y se anonimizan las respuestas.'
};

export default function PanelPrincipal() {
  const { usuario } = useAuth();
  const { mostrar } = useToast();
  const [campanas, setCampanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [porCerrar, setPorCerrar] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  useTitulo('Inicio');

  const cargarCampanas = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/campanas');
      setCampanas(data);
    } catch (err) {
      setError('No se pudieron cargar las campañas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCampanas();
  }, [cargarCampanas]);

  async function confirmarCierre() {
    setCerrando(true);
    try {
      const { data } = await api.post(`/campanas/${porCerrar.id_campana}/cerrar`);
      mostrar(data.mensaje || 'Campaña cerrada');
      setPorCerrar(null);
      cargarCampanas();
    } catch (err) {
      mostrar(err.response?.data?.error || 'No se pudo cerrar la campaña', 'error');
    } finally {
      setCerrando(false);
    }
  }

  const encuestado = usuario.rol === 'DOCENTE' || usuario.rol === 'ADMINISTRATIVO';
  const analista = usuario.rol === 'RRHH' || usuario.rol === 'GERENCIA';

  return (
    <div>
      <header className="cabecera-pagina">
        <h1>Hola, {primerNombre(usuario.nombre)}</h1>
        <p className="subtitulo">
          {ETIQUETA_ROL[usuario.rol] || usuario.rol}. {SUBTITULO[usuario.rol] || ''}
        </p>
      </header>

      <h2 className="titulo-seccion">Campañas</h2>

      {cargando ? (
        <Esqueleto filas={3} />
      ) : error ? (
        <MensajeError
          onReintentar={() => {
            setCargando(true);
            cargarCampanas();
          }}
        >
          {error}
        </MensajeError>
      ) : campanas.length === 0 ? (
        <EstadoVacio icono={<IconoBandeja tamano={36} />} titulo="Aún no hay campañas">
          Cuando el área de TI cree una campaña, aparecerá aquí.
        </EstadoVacio>
      ) : (
        <ul className="lista-campanas">
          {campanas.map((c) => (
            <li key={c.id_campana} className="campana">
              <div className="campana-info">
                <div className="campana-titulo">
                  <h3>{c.titulo}</h3>
                  <InsigniaEstado estado={c.estado} />
                </div>
                <p className="campana-meta">
                  <span>{c.nombre_instrumento}</span>
                  {(c.fecha_inicio || c.fecha_fin) && (
                    <span className="con-icono">
                      <IconoCalendario tamano={16} />
                      {formatearFecha(c.fecha_inicio)} – {formatearFecha(c.fecha_fin)}
                    </span>
                  )}
                </p>
              </div>

              <div className="campana-acciones">
                {encuestado && c.estado === 'ACTIVA' && (
                  <Link to={`/encuesta/${c.id_campana}`} className="btn btn-primary">
                    Responder encuesta
                  </Link>
                )}
                {encuestado && c.estado !== 'ACTIVA' && (
                  <span className="texto-suave">Esta campaña ya no recibe respuestas</span>
                )}

                {analista && (
                  <>
                    <Link to={`/dashboard?campana=${c.id_campana}`} className="btn btn-secondary">
                      <IconoGrafico tamano={18} />
                      Ver dashboard
                    </Link>
                    <Link to="/alertas" className="btn btn-ghost">
                      <IconoCampana tamano={18} />
                      Ver alertas
                    </Link>
                  </>
                )}

                {usuario.rol === 'TI' && c.estado === 'ACTIVA' && (
                  <button type="button" className="btn btn-peligro-suave" onClick={() => setPorCerrar(c)}>
                    Cerrar campaña
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        abierto={Boolean(porCerrar)}
        titulo="¿Cerrar esta campaña?"
        textoConfirmar="Cerrar campaña"
        peligro
        cargando={cerrando}
        onConfirmar={confirmarCierre}
        onCancelar={() => setPorCerrar(null)}
      >
        <p>
          <strong>{porCerrar?.titulo}</strong>
        </p>
        <p>
          Al cerrarla se generan las alertas tempranas y se anonimizan las respuestas: después ya no será posible
          saber quién respondió. Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
