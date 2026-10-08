# Frontend — Sistema Web de Clima Laboral (React + Vite)

## 1. Instalación

```bash
cd frontend
npm install
```

## 2. Requisito previo

El backend (Node.js + Express) debe estar corriendo en `http://localhost:4000`
(revisa `npm run dev` en la carpeta `backend`). Este frontend apunta a esa URL
en `src/api/client.js` — si cambias el puerto del backend, ajusta esa constante.

## 3. Levantar el frontend

```bash
npm run dev
```

Abre `http://localhost:5173`.

## 4. Flujo de prueba (con los usuarios que ya creaste en SQL Server)

1. **Login como Admin (TI)** → verás las campañas y el botón "Cerrar campaña".
2. **Login como Docente** (`docenteX.prueba@test.com`) → verás "Responder encuesta"
   en las campañas activas, y al entrar se genera automáticamente su token
   anónimo y se cargan las preguntas paso a paso.
3. **Login como RRHH** → accede a "Dashboard" (tabla agregada + exportar Excel/PDF)
   y a "Alertas" (lista de alertas generadas, con botón para marcarlas como atendidas).

## 5. Mapeo con los wireframes originales

| Pantalla del documento de wireframes | Componente React |
|---|---|
| 1. Inicio de Sesión | `pages/Login.jsx` |
| 2. Panel Principal | `pages/PanelPrincipal.jsx` |
| 3. Módulo de Encuestas + 4. Formulario Dinámico | `pages/Encuesta.jsx` (unificados: se obtiene el token y las preguntas en un solo flujo) |
| 5. Confirmación de Envío | `pages/ConfirmacionEnvio.jsx` |
| 6. Dashboard RR.HH. (BI) + 7. Reporte/Exportación | `pages/DashboardRRHH.jsx` (unificados) |
| — (pantalla nueva, Fase de Alertas) | `pages/PanelAlertas.jsx` |

## 6. Pendientes para completar la Fase 5

- Formulario para que TI cree campañas y preguntas desde la interfaz (hoy se
  crean directo en SQL o vía Postman, según lo probamos en la Fase 4).
- Reemplazar la tabla simple del Dashboard por gráficos (barras/circular) —
  se puede usar `recharts` o `chart.js` sin tocar el backend, ya que
  `/reportes/dashboard/:id` ya devuelve los datos agregados listos para graficar.
- Manejo de expiración del token JWT (hoy, si expira, las peticiones fallan con
  401 pero no se redirige automáticamente al login — se puede agregar un
  interceptor de respuesta en `src/api/client.js` para eso).

## Diseño de la interfaz (rediseño visual)

- Estilo sobrio institucional (azul marino + acento verde azulado) con semáforo de riesgo bajo/medio/alto.
- **Modo claro/oscuro**: botón en la barra superior y en el login; la preferencia se guarda en `localStorage` (`tema`) solo cuando el usuario la cambia; por defecto sigue el tema del sistema.
- **Gráficos sin dependencias nuevas**: barras y marcadores de riesgo hechos con CSS (`components/EscalaRiesgo.jsx`), con las mismas zonas que `regla_umbral` (0–2 bajo, 2–3 medio, 3–4 alto).
- El nivel de riesgo nunca se indica solo con color: siempre lleva icono y texto.
- Accesibilidad: enlace "Saltar al contenido", foco visible, diálogos `<dialog>` nativos, `prefers-reduced-motion`.
- Encuesta: una pregunta por pantalla, barra de progreso, atajo de teclado 1–5, versión móvil en columna.
- Solo cambia el frontend; no se tocó la API ni el backend (las 51 pruebas siguen vigentes). No requiere instalar paquetes: `npm run dev`.
- La tipografía (Public Sans) se carga desde Google Fonts; sin internet se usa la fuente del sistema.
