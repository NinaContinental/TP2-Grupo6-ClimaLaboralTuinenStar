# Sistema Web de Medición y Análisis de Clima Laboral — Instituto Tuinen Star

Proyecto de Taller de Proyectos 2 (Ing. de Sistemas e Informática, NRC 34028).

## Estructura del repositorio

```
clima_laboral/
├── backend/    # API REST — Node.js + Express + SQL Server
├── frontend/   # Interfaz web — React + Vite
└── .gitignore
```

## Puesta en marcha rápida

### 1. Base de datos
Ejecuta el script de creación en SQL Server Management Studio (ver `migracion_sql_server.md` si lo tienes en tu carpeta de documentación del proyecto).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# edita .env con tus credenciales reales de SQL Server
npm run dev
```
Corre en `http://localhost:4000`. Instrucciones completas en `backend/README.md`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Corre en `http://localhost:5173`. Instrucciones completas en `frontend/README.md`.

## Módulos del sistema

- **Autenticación** — JWT + Bcrypt, roles: TI, DOCENTE, ADMINISTRATIVO, RRHH, GERENCIA.
- **Encuestas anónimas** — token aleatorio (UUID) por usuario y campaña, sin relación con la identidad.
- **Alertas Tempranas** — motor de reglas que detecta automáticamente niveles de riesgo por área y dimensión, protegido por k-anonimato (mínimo 5 respondientes).
- **Reportes** — dashboard agregado y exportación a Excel/PDF, con la misma protección de k-anonimato.
- **Anonimización** — al cerrar una campaña, el vínculo usuario-token se elimina de forma irreversible (`id_usuario = NULL`).

## Equipo

- Ayme Nina, Johan
- Quispe Juarez, Johan Robinho
- Nina Meza, Airton Waldir

Docente: Ing. Néstor Gutiérrez Huamán
