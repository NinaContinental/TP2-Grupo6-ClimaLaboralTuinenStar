import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BotonTema from './BotonTema';
import { IconoCerrar, IconoEstrella, IconoMenu, IconoSalir } from './Icons';
import { ETIQUETA_ROL, iniciales } from '../lib/riesgo';

export default function NavBar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);

  // Al navegar, el menu movil se cierra solo.
  useEffect(() => {
    setAbierto(false);
  }, [location.pathname]);

  if (!usuario) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const analista = usuario.rol === 'RRHH' || usuario.rol === 'GERENCIA';
  const enlaces = [
    { to: '/panel', texto: 'Inicio' },
    ...(analista
      ? [
          { to: '/dashboard', texto: 'Dashboard' },
          { to: '/alertas', texto: 'Alertas' }
        ]
      : [])
  ];

  return (
    <header className="barra">
      <div className="barra-interior">
        <Link to="/panel" className="marca" aria-label="Clima Laboral, ir al inicio">
          <span className="marca-icono">
            <IconoEstrella tamano={16} />
          </span>
          <span className="marca-texto">
            <strong>Clima Laboral</strong>
            <span>Instituto Tuinen Star</span>
          </span>
        </Link>

        <button
          type="button"
          className="btn-icono barra-menu"
          aria-expanded={abierto}
          aria-controls="barra-panel"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? <IconoCerrar /> : <IconoMenu />}
        </button>

        <div id="barra-panel" className={`barra-panel${abierto ? ' abierto' : ''}`}>
          <nav className="barra-nav" aria-label="Principal">
            {enlaces.map((e) => (
              <NavLink key={e.to} to={e.to} className={({ isActive }) => (isActive ? 'activo' : '')}>
                {e.texto}
              </NavLink>
            ))}
          </nav>

          <div className="barra-acciones">
            <BotonTema />
            <div className="usuario-chip">
              <span className="avatar" aria-hidden="true">{iniciales(usuario.nombre)}</span>
              <span className="usuario-datos">
                <strong>{usuario.nombre}</strong>
                <span>{ETIQUETA_ROL[usuario.rol] || usuario.rol}</span>
              </span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <IconoSalir tamano={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
