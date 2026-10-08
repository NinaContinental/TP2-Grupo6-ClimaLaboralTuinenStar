import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BotonTema from '../components/BotonTema';
import { Spinner } from '../components/Estados';
import {
  IconoAlerta,
  IconoCandado,
  IconoEscudo,
  IconoEstrella,
  IconoGrupo,
  IconoOjo,
  IconoOjoTachado
} from '../components/Icons';
import useTitulo from '../lib/useTitulo';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  useTitulo('Iniciar sesión');

  if (usuario) return <Navigate to="/panel" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(correo, contrasena);
      navigate('/panel');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-lado">
        <div className="marca marca-clara">
          <span className="marca-icono">
            <IconoEstrella tamano={16} />
          </span>
          <span className="marca-texto">
            <strong>Clima Laboral</strong>
            <span>Instituto Tuinen Star</span>
          </span>
        </div>

        <div className="login-mensaje">
          <h1>Tu opinión mejora cómo trabajamos</h1>
          <p>
            Responde la encuesta de clima laboral en pocos minutos. Nadie podrá saber qué respondiste.
          </p>
        </div>

        <ul className="garantias">
          <li>
            <IconoCandado />
            <div>
              <strong>Respuestas separadas de tu cuenta</strong>
              <span>
                Cada encuesta usa un token anónimo. Al cerrar la campaña, el vínculo con tu usuario se elimina.
              </span>
            </div>
          </li>
          <li>
            <IconoGrupo />
            <div>
              <strong>Solo se reportan grupos de 5 o más</strong>
              <span>Si un área tiene menos de 5 respondientes, sus resultados no se muestran.</span>
            </div>
          </li>
          <li>
            <IconoEscudo />
            <div>
              <strong>Datos protegidos por ley</strong>
              <span>Tratamiento conforme a la Ley N.° 29733, de protección de datos personales.</span>
            </div>
          </li>
        </ul>
      </aside>

      <section className="login-form-lado">
        <div className="login-tema">
          <BotonTema />
        </div>

        <div className="login-form">
          <div>
            <h2>Iniciar sesión</h2>
            <p className="ayuda">Usa tu correo institucional.</p>
          </div>

          <form onSubmit={handleSubmit} className="formulario">
            <div className="campo">
              <label htmlFor="correo">Correo institucional</label>
              <input
                id="correo"
                className="entrada"
                type="email"
                autoComplete="username"
                placeholder="nombre@institutotuinenstar.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="contrasena">Contraseña</label>
              <div className="entrada-clave">
                <input
                  id="contrasena"
                  className="entrada"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-icono"
                  onClick={() => setVerClave(!verClave)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verClave}
                >
                  {verClave ? <IconoOjoTachado /> : <IconoOjo />}
                </button>
              </div>
            </div>

            {error && (
              <div className="aviso aviso-error" role="alert">
                <IconoAlerta tamano={20} />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-ancho" disabled={enviando} aria-busy={enviando}>
              {enviando && <Spinner />}
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="nota">
            <IconoCandado tamano={16} />
            Tus respuestas son anónimas y están protegidas por la Ley N.° 29733.
          </p>
        </div>
      </section>
    </div>
  );
}
