import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import RutaPrivada from './components/RutaPrivada';
import Login from './pages/Login';
import PanelPrincipal from './pages/PanelPrincipal';
import Encuesta from './pages/Encuesta';
import ConfirmacionEnvio from './pages/ConfirmacionEnvio';
import DashboardRRHH from './pages/DashboardRRHH';
import PanelAlertas from './pages/PanelAlertas';

export default function App() {
  const { pathname } = useLocation();
  // El login ocupa toda la pantalla; el resto va en un contenedor centrado.
  const claseMain = pathname === '/login' ? 'sin-contenedor' : 'contenedor';

  return (
    <>
      <a className="salto" href="#contenido">Saltar al contenido</a>
      <NavBar />
      <main id="contenido" className={claseMain}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/panel"
            element={
              <RutaPrivada>
                <PanelPrincipal />
              </RutaPrivada>
            }
          />

          <Route
            path="/encuesta/:idCampana"
            element={
              <RutaPrivada rolesPermitidos={['DOCENTE', 'ADMINISTRATIVO']}>
                <Encuesta />
              </RutaPrivada>
            }
          />

          <Route
            path="/encuesta-enviada"
            element={
              <RutaPrivada>
                <ConfirmacionEnvio />
              </RutaPrivada>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RutaPrivada rolesPermitidos={['RRHH', 'GERENCIA']}>
                <DashboardRRHH />
              </RutaPrivada>
            }
          />

          <Route
            path="/alertas"
            element={
              <RutaPrivada rolesPermitidos={['RRHH', 'GERENCIA']}>
                <PanelAlertas />
              </RutaPrivada>
            }
          />

          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </main>
    </>
  );
}
