import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import EscalaRiesgo, { EjesEscala } from '../components/EscalaRiesgo';
import { InsigniaRiesgo } from '../components/Insignia';
import { Esqueleto, EstadoVacio, MensajeError, Spinner } from '../components/Estados';
import { IconoCandado, IconoDescarga, IconoGrupo } from '../components/Icons';
import { ETIQUETA_NIVEL, ZONAS, nivelDe } from '../lib/riesgo';
import useTitulo from '../lib/useTitulo';

export default function DashboardRRHH() {
  useTitulo('Dashboard');
  const [params, setParams] = useSearchParams();
  const { mostrar } = useToast();

  const [campanas, setCampanas] = useState([]);
  const [idCampana, setIdCampana] = useState(params.get('campana') || '');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState('');

  // Lista de campañas para el selector (en vez de escribir el ID a mano).
  useEffect(() => {
    let activo = true;
    api
      .get('/campanas')
      .then(({ data }) => {
        if (!activo) return;
        setCampanas(data);
        setIdCampana((actual) => {
          if (actual) return actual;
          const preferida = data.find((c) => c.estado === 'CERRADA') || data[0];
          return preferida ? String(preferida.id_campana) : '';
        });
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la lista de campañas.');
      });
    return () => {
      activo = false;
    };
  }, []);

  // Consulta automatica al elegir campaña.
  useEffect(() => {
    if (!idCampana) return undefined;
    let activo = true;
    setCargando(true);
    setError('');
    setDatos(null);
    api
      .get(`/reportes/dashboard/${idCampana}`)
      .then(({ data }) => {
        if (activo) setDatos(data);
      })
      .catch(() => {
        if (activo) setError('No se pudo obtener el dashboard.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [idCampana]);

  function cambiarCampana(e) {
    setIdCampana(e.target.value);
    setParams({ campana: e.target.value }, { replace: true });
  }

  async function descargar(formato) {
    setDescargando(formato);
    try {
      const res = await api.get(`/reportes/exportar/${formato}/${idCampana}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `reporte_campana_${idCampana}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      mostrar('Reporte descargado');
    } catch (err) {
      mostrar('No se pudo descargar el reporte', 'error');
    } finally {
      setDescargando('');
    }
  }

  const filas = useMemo(() => {
    if (!datos) return [];
    return datos
      .map((f) => ({
        area: f.nombre_area,
        dimension: f.nombre_dimension,
        promedio: Number(f.promedio),
        n: Number(f.n_respondientes)
      }))
      .map((f) => ({ ...f, nivel: nivelDe(f.promedio) }))
      .sort((a, b) => b.promedio - a.promedio);
  }, [datos]);

  const resumen = useMemo(() => {
    if (filas.length === 0) return null;
    const totalN = filas.reduce((s, f) => s + f.n, 0);
    const ponderado = totalN > 0 ? filas.reduce((s, f) => s + f.promedio * f.n, 0) / totalN : 0;
    return { ponderado, nivel: nivelDe(ponderado), mayor: filas[0] };
  }, [filas]);

  const campanaActual = campanas.find((c) => String(c.id_campana) === String(idCampana));

  return (
    <div>
      <header className="cabecera-pagina">
        <h1>Dashboard de clima laboral</h1>
        <p className="subtitulo">
          Promedio por área y dimensión, en una escala de 0 a 4. Un promedio más alto indica mayor riesgo.
        </p>
      </header>

      <div className="herramientas">
        <div className="campo campo-campana">
          <label htmlFor="campana">Campaña</label>
          <select id="campana" className="entrada" value={idCampana} onChange={cambiarCampana} disabled={campanas.length === 0}>
            {campanas.length === 0 && <option value="">Sin campañas</option>}
            {campanas.map((c) => (
              <option key={c.id_campana} value={c.id_campana}>
                {c.titulo} ({c.estado === 'ACTIVA' ? 'activa' : 'cerrada'})
              </option>
            ))}
          </select>
        </div>

        <div className="herramientas-acciones">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => descargar('excel')}
            disabled={!idCampana || Boolean(descargando)}
            aria-busy={descargando === 'excel'}
          >
            {descargando === 'excel' ? <Spinner /> : <IconoDescarga tamano={18} />}
            Descargar Excel
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => descargar('pdf')}
            disabled={!idCampana || Boolean(descargando)}
            aria-busy={descargando === 'pdf'}
          >
            {descargando === 'pdf' ? <Spinner /> : <IconoDescarga tamano={18} />}
            Descargar PDF
          </button>
        </div>
      </div>

      {error && <MensajeError>{error}</MensajeError>}

      {cargando && <Esqueleto filas={2} alto={140} />}

      {datos && filas.length === 0 && (
        <EstadoVacio icono={<IconoGrupo tamano={36} />} titulo="Todavía no hay grupos con datos suficientes">
          Para proteger el anonimato, un área aparece cuando al menos 5 personas respondieron. Los resultados se
          mostrarán aquí en cuanto se alcance ese mínimo.
        </EstadoVacio>
      )}

      {resumen && (
        <>
          <div className="resumen">
            <div>
              <p className="resumen-valor">{resumen.ponderado.toFixed(1)}</p>
              <p className="resumen-etiqueta">Promedio general (ponderado por respondientes)</p>
              <InsigniaRiesgo nivel={resumen.nivel} />
            </div>
            <div>
              <p className="resumen-valor">{filas.length}</p>
              <p className="resumen-etiqueta">
                {filas.length === 1 ? 'Grupo con datos' : 'Grupos con datos'} (área y dimensión, 5 o más respondientes)
              </p>
            </div>
            <div>
              <p className="resumen-valor">{resumen.mayor.promedio.toFixed(1)}</p>
              <p className="resumen-etiqueta">Mayor atención</p>
              <p className="resumen-detalle">
                {resumen.mayor.area} · {resumen.mayor.dimension}
              </p>
            </div>
          </div>

          <section className="panel grafico" aria-labelledby="titulo-grafico">
            <div className="grafico-cabecera">
              <h2 id="titulo-grafico">Promedio por área y dimensión</h2>
              <ul className="leyenda" aria-label="Zonas de riesgo">
                {ZONAS.map((z) => (
                  <li key={z.nivel}>
                    <span className={`muestra muestra-${z.nivel.toLowerCase()}`} aria-hidden="true" />
                    {ETIQUETA_NIVEL[z.nivel]} ({z.desde}–{z.hasta})
                  </li>
                ))}
              </ul>
            </div>

            <div className="fila-grafico fila-ejes" aria-hidden="true">
              <span />
              <EjesEscala />
              <span />
            </div>

            {filas.map((f) => (
              <div className="fila-grafico" key={`${f.area}-${f.dimension}`}>
                <div className="fila-etiqueta">
                  <strong>{f.area}</strong>
                  <span>{f.dimension}</span>
                </div>
                <EscalaRiesgo valor={f.promedio} modo="barra" ejes={false} />
                <div className="fila-valor">
                  <span className="valor-num">{f.promedio.toFixed(2)}</span>
                  <InsigniaRiesgo nivel={f.nivel} />
                  <span className="valor-n">n = {f.n}</span>
                </div>
              </div>
            ))}
          </section>

          <details className="datos-tabla">
            <summary>Ver los datos en tabla</summary>
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Área</th>
                    <th scope="col">Dimensión</th>
                    <th scope="col" className="num">Promedio</th>
                    <th scope="col" className="num">Respondientes</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={`${f.area}-${f.dimension}`}>
                      <td>{f.area}</td>
                      <td>{f.dimension}</td>
                      <td className="num">{f.promedio.toFixed(2)}</td>
                      <td className="num">{f.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <p className="nota-anonimato">
        <IconoCandado tamano={16} />
        Datos agregados y anonimizados{campanaActual ? ` de “${campanaActual.titulo}”` : ''}. Los grupos con menos de 5
        respondientes se omiten. Los niveles son referenciales; las alertas usan las reglas oficiales del sistema.
      </p>
    </div>
  );
}
