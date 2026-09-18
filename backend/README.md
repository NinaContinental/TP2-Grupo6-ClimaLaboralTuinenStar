# Backend — Sistema Web de Clima Laboral (Node.js + Express + SQL Server)

## 1. Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con los datos reales de tu instancia de SQL Server (usuario, password, nombre de la base que ya migraste).

## 2. Levantar el servidor

```bash
npm run dev
```

Debe mostrar en consola: `Conectado a SQL Server: ClimaLaboralTuinenStar` y `Servidor escuchando en el puerto 4000`.

Prueba rápida: `GET http://localhost:4000/api/health` → `{"estado":"ok"}`

## 3. Roles esperados en la tabla `rol`

El middleware de autenticación filtra por `nombre_rol` exacto. Asegúrate de insertar estos valores (o ajusta los arrays de roles en `src/routes/*.routes.js` si usas otros nombres):

```sql
INSERT INTO rol (nombre_rol, descripcion) VALUES
('TI', 'Jefe de Proyecto / Administrador del sistema'),
('DOCENTE', 'Personal docente'),
('ADMINISTRATIVO', 'Personal administrativo'),
('RRHH', 'Recursos Humanos'),
('GERENCIA', 'Gerencia General');
```

Y crea al menos un usuario TI con contraseña ya hasheada con Bcrypt (puedes generarla con un script corto de Node o con una libreria online de bcrypt, nunca insertes la contraseña en texto plano).

## 4. Flujo de prueba end-to-end (con Postman o Thunder Client)

1. `POST /api/auth/login` → obtienes el `token` JWT.
2. `POST /api/campanas` (rol TI) → crea una campaña con un `id_instrumento` existente.
3. `POST /api/campanas/:id/preguntas` — nota: **crear preguntas aún no tiene endpoint** (ver sección 5, es lo siguiente a construir); por ahora insértalas directo por SQL para probar.
4. `POST /api/campanas/:id/token` (rol DOCENTE/ADMINISTRATIVO) → obtiene su `id_token` anónimo.
5. `POST /api/respuestas` con `{ id_token, respuestas: [...] }`.
6. `POST /api/campanas/:id/cerrar` (rol TI) → ejecuta `sp_generar_alertas` y `sp_anonimizar_campana`.
7. `GET /api/alertas` (rol RRHH/GERENCIA) → ver las alertas activas.
8. `GET /api/reportes/dashboard/:id_campana` y `GET /api/reportes/exportar/excel/:id_campana`.

## 5. Lo que falta para completar la Fase 4 (siguiente iteración)

- Endpoint `POST /campanas/:id/preguntas` para cargar preguntas desde el frontend (por ahora se insertan directo en SQL).
- Endpoint de registro de usuarios (`POST /usuarios`) con hash de contraseña vía Bcrypt en el propio backend.
- Endpoint de bitácora de auditoría (registrar login, cierre de campaña, exportaciones) en la tabla `bitacora_auditoria`.
- Validación de esquema de entrada (ej. con `zod` o `express-validator`) en vez de validaciones manuales.

## 6. Cómo mapea a la arquitectura en capas del proyecto

| Carpeta | Capa (Clean Architecture) |
|---|---|
| `src/routes/` | Presentación (define los endpoints) |
| `src/controllers/` | Aplicación (casos de uso: login, cerrar campaña, generar alertas) |
| `src/middleware/` | Aplicación (reglas transversales: autenticación y roles) |
| `src/config/db.js` | Infraestructura (conexión a SQL Server) |
