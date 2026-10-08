import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Esqueleto, MensajeError, Spinner } from '../components/Estados';
import { IconoAlerta, IconoCandado, IconoCheck } from '../components/Icons';
import useTitulo from '../lib/useTitulo';

const OPCIONES = [
  { valor: 0, texto: 'Nunca' },
  { valor: 1, texto: 'Rara vez' },
  { valor: 2, texto: 'A veces' },
  { valor: 3, texto: 'Frecuentemente' },
  { valor: 4, texto: 'Siempre' }
];

export default function Encuesta() {
  const { idCampana } = useParams();
  const navigate = useNavigate();

  const [idToken, setIdToken] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  useTitulo('Encuesta');

  useEffect(() => {
    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCampana]);

  async function iniciar() {
    try {
      const tokenResp = await api.post(`/campanas/${idCampana}/token`);
      setIdToken(tokenResp.data.id_token);

      const preguntasResp = await api.get(`/campanas/${idCampana}/preguntas`);
      setPreguntas(preguntasResp.data);
    } catch (err) {
      setError('No se pudo iniciar la encuesta.');
    } finally {
      setCargando(false);
    }
  }

  const pregunta = preguntas[indice];

  function seleccionar(valor) {
    if (!pregunta) return;
    setRespuestas((prev) => ({ ...prev, [pregunta.id_pregunta]: valor }));
  }

  function siguiente() {
    if (indice < preguntas.length - 1) {
      setIndice(indice + 1);
    } else {
      enviar();
    }
  }

  function anterior() {
    if (indice > 0) setIndice(indice - 1);
  }

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setErrorEnvio('');

    const payload = {
      id_token: idToken,
      respuestas: Object.entries(respuestas).map(([id_pregunta, valor_respuesta]) => ({
        id_pregunta: Number(id_pregunta),
        valor_respuesta
      }))
    };

    try {
      await api.post('/respuestas', payload);
      navigate('/encuesta-enviada');
    } catch (err) {
      setErrorEnvio('No se pudieron registrar tus respuestas. Tus selecciones siguen aquí: vuelve a intentarlo.');
      setEnviando(false);
    }
  }

  // Atajo de teclado: 1 a 5 eligen la opcion de la pregunta actual.
  useEffect(() => {
    function alPulsar(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !pregunta) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= OPCIONES.length) {
        seleccionar(OPCIONES[n - 1].valor);
      }
    }
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  });

  if (cargando) return <div className="encuesta"><Esqueleto filas={1} alto={380} /></div>;
  if (error) return <div className="encuesta"><MensajeError>{error}</MensajeError></div>;
  if (preguntas.length === 0) {
    return (
      <div className="encuesta">
        <MensajeError>Esta campaña todavía no tiene preguntas cargadas.</MensajeError>
      </div>
    );
  }

  const valorActual = respuestas[pregunta.id_pregunta];
  const ultima = indice === preguntas.length - 1;

  return (
    <section className="encuesta panel" aria-labelledby="pregunta-actual">
      <div className="encuesta-cabecera">
        <p className="encuesta-dimension">{pregunta.nombre_dimension}</p>
        <span className="sello-anonimo">
          <IconoCandado tamano={14} />
          Respuesta anónima
        </span>
      </div>

      <ol className="pasos" aria-label="Progreso de la encuesta">
        {preguntas.map((p, i) => (
          <li
            key={p.id_pregunta}
            className={i < indice ? 'hecho' : i === indice ? 'actual' : ''}
            aria-current={i === indice ? 'step' : undefined}
          />
        ))}
      </ol>
      <p className="pasos-texto">
        Pregunta {indice + 1} de {preguntas.length}
      </p>

      <h1 id="pregunta-actual" key={pregunta.id_pregunta} className="pregunta">
        {pregunta.texto_pregunta}
      </h1>

      <div className="likert" role="radiogroup" aria-labelledby="pregunta-actual">
        {OPCIONES.map((op, i) => {
          const marcada = valorActual === op.valor;
          return (
            <label key={op.valor} className="likert-op">
              <input
                type="radio"
                name={`pregunta-${pregunta.id_pregunta}`}
                checked={marcada}
                onChange={() => seleccionar(op.valor)}
              />
              <span className="likert-cuerpo">
                <span className="likert-tecla" aria-hidden="true">
                  {marcada ? <IconoCheck tamano={18} /> : i + 1}
                </span>
                <span className="likert-texto">{op.texto}</span>
              </span>
            </label>
          );
        })}
      </div>

      {errorEnvio && (
        <div className="aviso aviso-error" role="alert">
          <IconoAlerta tamano={20} />
          <p>{errorEnvio}</p>
        </div>
      )}

      <div className="encuesta-pie">
        <button type="button" className="btn btn-ghost" onClick={anterior} disabled={indice === 0 || enviando}>
          Anterior
        </button>
        <span className="atajo">Atajo: teclas 1 a 5</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={siguiente}
          disabled={valorActual === undefined || enviando}
          aria-busy={enviando}
        >
          {enviando && <Spinner />}
          {ultima ? (errorEnvio ? 'Reintentar envío' : 'Enviar respuestas') : 'Siguiente'}
        </button>
      </div>

      <p className="nota-anonimato">
        <IconoCandado tamano={16} />
        Tus respuestas se guardan con un token anónimo, sin vínculo con tu identidad.
      </p>
    </section>
  );
}
