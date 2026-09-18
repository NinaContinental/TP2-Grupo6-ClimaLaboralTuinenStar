import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(correo, contrasena);
      navigate('/panel');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion');
    }
  }

  return (
    <div className="tarjeta tarjeta-login">
      <h2>Sistema de Medicion y Analisis de Clima Laboral</h2>
      <h3>Iniciar Sesion</h3>
      <form onSubmit={handleSubmit}>
        <label>Usuario / Correo institucional</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <label>Contrasena</label>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Ingresar</button>
      </form>
      <p className="nota-anonimato">
        Sus respuestas son 100% anonimas y estan protegidas (Ley N.° 29733).
      </p>
    </div>
  );
}
