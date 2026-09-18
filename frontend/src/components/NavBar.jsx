import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <span className="navbar-titulo">Clima Laboral - Tuinen Star</span>
      <div className="navbar-links">
        <Link to="/panel">Inicio</Link>
        {(usuario.rol === 'RRHH' || usuario.rol === 'GERENCIA') && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/alertas">Alertas</Link>
          </>
        )}
        <span className="navbar-usuario">{usuario.nombre} ({usuario.rol})</span>
        <button onClick={handleLogout}>Cerrar sesion</button>
      </div>
    </nav>
  );
}
