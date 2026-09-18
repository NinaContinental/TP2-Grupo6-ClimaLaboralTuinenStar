import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

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
  const [error, setError] = useState('');

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
      setError('No se pudo iniciar la encuesta');
    } finally {
      setCargando(false);
    }
  }

  function seleccionar(valor) {
    const pregunta = preguntas[indice];
    setRespuestas({ ...respuestas, [pregunta.id_pregunta]: valor });
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
      setError('Error al registrar las respuestas');
    }
  }

  if (cargando) return <p>Cargando encuesta...</p>;
  if (error) return <p className="error">{error}</p>;
  if (preguntas.length === 0) {
    return <p>Esta campana no tiene preguntas cargadas todavia.</p>;
  }

  const pregunta = preguntas[indice];
  const valorActual = respuestas[pregunta.id_pregunta];

  return (
    <div className="tarjeta">
      <p className="nota-anonimato">Encuesta de Clima Laboral — Anonima y Confidencial</p>

      <div className="barra-progreso">
        <div
          className="barra-progreso-relleno"
          style={{ width: `${((indice + 1) / preguntas.length) * 100}%` }}
        />
      </div>
      <p>Pregunta {indice + 1} de {preguntas.length} — {pregunta.nombre_dimension}</p>

      <h3>{pregunta.texto_pregunta}</h3>

      <div className="opciones-likert">
        {OPCIONES.map((op) => (
          <label key={op.valor}>
            <input
              type="radio"
              name={`pregunta-${pregunta.id_pregunta}`}
              checked={valorActual === op.valor}
              onChange={() => seleccionar(op.valor)}
            />
            {op.texto}
          </label>
        ))}
      </div>

      <div className="acciones-formulario">
        <button onClick={anterior} disabled={indice === 0}>Anterior</button>
        <button onClick={siguiente} disabled={valorActual === undefined}>
          {indice === preguntas.length - 1 ? 'Enviar' : 'Siguiente'}
        </button>
      </div>

      <p className="nota-anonimato">
        Sus respuestas se almacenan mediante un Token Anonimo, sin vinculo a su identidad.
      </p>
    </div>
  );
}
