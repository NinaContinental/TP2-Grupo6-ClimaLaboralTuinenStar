import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import RutaPrivada from './components/RutaPrivada';
import Login from './pages/Login';
import PanelPrincipal from './pages/PanelPrincipal';
import Encuesta from './pages/Encuesta';
import ConfirmacionEnvio from './pages/ConfirmacionEnvio';
import DashboardRRHH from './pages/DashboardRRHH';
import PanelAlertas from './pages/PanelAlertas';

export default function App() {
  return (
    <>
      <NavBar />
      <div className="contenedor">
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
      </div>
    </>
  );
}
