import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import EscalaRiesgo from '../components/EscalaRiesgo';
import { InsigniaEstado, InsigniaRiesgo } from '../components/Insignia';
import { Esqueleto, EstadoVacio, MensajeError } from '../components/Estados';
import { IconoCheck } from '../components/Icons';
import { formatearFecha } from '../lib/riesgo';
import useTitulo from '../lib/useTitulo';

const ORDEN_RIESGO = { ALTO: 0, MEDIO: 1, BAJO: 2 };

const FILTROS = [
  { clave: 'TODAS', texto: 'Todas' },
  { clave: 'ACTIVA', texto: 'Activas' },
  { clave: 'ATENDIDA', texto: 'Atendidas' }
];

export default function PanelAlertas() {
  useTitulo('Alertas tempranas');
  const { mostrar } = useToast();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('ACTIVA');
  const [porAtender, setPorAtender] = useState(null);
  const [atendiendo, setAtendiendo] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/alertas');
      setAlertas(data);
    } catch (err) {
      setError('No se pudieron cargar las alertas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarAtencion() {
    setAtendiendo(true);
    try {
      await api.put(`/alertas/${porAtender.id_alerta}/atender`);
      mostrar('Alerta marcada como atendida');
      setPorAtender(null);
      cargar();
    } catch (err) {
      mostrar('No se pudo actualizar la alerta', 'error');
    } finally {
      setAtendiendo(false);
    }
  }

  const cuentas = useMemo(
    () => ({
      TODAS: alertas.length,
      ACTIVA: alertas.filter((a) => a.estado === 'ACTIVA').length,
      ATENDIDA: alertas.filter((a) => a.estado === 'ATENDIDA').length
    }),
    [alertas]
  );

  // Activas primero y, dentro de cada grupo, el riesgo mas alto arriba.
  const visibles = useMemo(() => {
    return alertas
      .filter((a) => filtro === 'TODAS' || a.estado === filtro)
      .sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === 'ACTIVA' ? -1 : 1;
        return (ORDEN_RIESGO[a.nivel_riesgo] ?? 9) - (ORDEN_RIESGO[b.nivel_riesgo] ?? 9);
      });
  }, [alertas, filtro]);

  return (
    <div>
      <header className="cabecera-pagina">
        <h1>Alertas tempranas</h1>
        <p className="subtitulo">
          Se generan al cerrar una campaña, solo para grupos de 5 o más respondientes. Atiende primero las de riesgo
          alto.
        </p>
      </header>

      {cargando ? (
        <Esqueleto filas={3} alto={190} />
      ) : error ? (
        <MensajeError
          onReintentar={() => {
            setCargando(true);
            cargar();
          }}
        >
          {error}
        </MensajeError>
      ) : (
        <>
          <div className="filtros" role="group" aria-label="Filtrar alertas por estado">
            {FILTROS.map((f) => (
              <button
                key={f.clave}
                type="button"
                className="filtro"
                aria-pressed={filtro === f.clave}
                onClick={() => setFiltro(f.clave)}
              >
                {f.texto}
                <span className="cuenta">{cuentas[f.clave]}</span>
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <EstadoVacio
              icono={<IconoCheck tamano={36} />}
              titulo={alertas.length === 0 ? 'Aún no hay alertas' : 'No hay alertas en este filtro'}
            >
              {alertas.length === 0
                ? 'Se generarán cuando se cierre una campaña con grupos de 5 o más respondientes.'
                : 'Prueba con otro filtro para ver el resto.'}
            </EstadoVacio>
          ) : (
            <ul className="lista-alertas">
              {visibles.map((a) => {
                const nivel = String(a.nivel_riesgo).toLowerCase();
                const atendida = a.estado === 'ATENDIDA';
                return (
                  <li key={a.id_alerta} className={`alerta alerta-${nivel}${atendida ? ' alerta-atendida' : ''}`}>
                    <div className="alerta-cab">
                      <div>
                        <h2>{a.nombre_area}</h2>
                        <p className="alerta-dimension">{a.nombre_dimension}</p>
                      </div>
                      <div className="alerta-insignias">
                        <InsigniaRiesgo nivel={a.nivel_riesgo} />
                        <InsigniaEstado estado={a.estado} />
                      </div>
                    </div>

                    <div className="alerta-medidas">
                      <EscalaRiesgo valor={a.promedio_calculado} />
                      <p className="alerta-numeros">
                        <strong>{Number(a.promedio_calculado).toFixed(1)}</strong> de 4
                        <span>{a.n_respondientes} respondientes</span>
                      </p>
                    </div>

                    {a.texto_recomendacion && (
                      <div className="recomendacion">
                        <p className="recomendacion-titulo">Recomendación</p>
                        <p>{a.texto_recomendacion}</p>
                      </div>
                    )}

                    <div className="alerta-pie">
                      <span>Generada el {formatearFecha(a.fecha_generacion, false)}</span>
                      {!atendida && (
                        <button type="button" className="btn btn-secondary" onClick={() => setPorAtender(a)}>
                          <IconoCheck tamano={18} />
                          Marcar como atendida
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        abierto={Boolean(porAtender)}
        titulo="¿Marcar como atendida?"
        textoConfirmar="Marcar como atendida"
        cargando={atendiendo}
        onConfirmar={confirmarAtencion}
        onCancelar={() => setPorAtender(null)}
      >
        <p>
          <strong>
            {porAtender?.nombre_area} · {porAtender?.nombre_dimension}
          </strong>
        </p>
        <p>La alerta quedará registrada como atendida y pasará al filtro “Atendidas”.</p>
      </ConfirmDialog>
    </div>
  );
}
