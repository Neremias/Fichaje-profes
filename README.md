# Fichaje Profes — Sistema de Registro de Presentismo Docente

Plataforma web integral para el registro de asistencia del cuerpo docente en las instituciones **ICES** y **UCSE**, reemplazando formularios estáticos y planillas manuales.

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Frontend      │────▶│   Backend        │────▶│  PostgreSQL    │
│ React + Vite    │     │ Django + DRF     │     │   16           │
│ TypeScript      │     │ SimpleJWT        │     └────────────────┘
│ TailwindCSS     │     │ Python 3.12      │
└─────────────────┘     └──────────────────┘
        ↑                        ↑
   Puerto 3000              Puerto 8000
```

**Modelo de ausencia implícita:** si un docente no registra presencia en un horario programado, el sistema lo computa como ausencia sin necesidad de procesos en segundo plano.

## 🚀 Inicio rápido (Docker)

### Pre-requisitos
- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20

### Levantar el entorno de desarrollo

```bash
# 1. Clonar el repositorio
git clone https://github.com/Neremias/Fichaje-profes.git
cd Fichaje-profes

# 2. Levantar todos los servicios
docker compose up --build

# 3. (Primera vez) Crear un usuario administrador
docker compose exec backend python manage.py createsuperuser

# 4. (Opcional) Generar QR codes para las instituciones
docker compose exec backend python manage.py generate_qr --base-url http://localhost:5173
```

Servicios disponibles:
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |

## 🖥️ Inicio sin Docker (desarrollo local)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Migraciones y datos iniciales
python manage.py migrate
python manage.py seed_institutions   # Crea ICES y UCSE
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install

# Configurar variables de entorno
cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm run dev
```

## 📱 Flujo de fichaje (docente)

1. El docente escanea el **QR estático** de la institución
2. Se abre el formulario en `/fichar?inst=ices`
3. El navegador solicita permiso de **GPS** 🗺️
4. El sistema verifica en tiempo real:
   - ✅ **GPS válido**: el docente está dentro del radio permitido del aula
   - ✅ **Red válida**: la IP pertenece a la red institucional
5. El docente selecciona el **aula** y confirma
6. Se registra la presencia con timestamp, coordenadas e IP

> **Nota:** La validación de red es solo informativa y no bloquea el fichaje.

## 🗂️ Estructura del proyecto

```
Fichaje-profes/
├── backend/
│   ├── apps/
│   │   ├── users/         ← Usuarios, instituciones, autenticación JWT
│   │   ├── attendance/    ← Registros de asistencia, validación GPS/IP
│   │   ├── schedules/     ← Materias, aulas, horarios
│   │   └── reports/       ← Reportes de ausencia, exportación CSV/XLSX
│   ├── config/
│   │   └── settings/      ← base.py, development.py, production.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         ← Login, Fichar, Dashboard, Teachers, Schedules, Reports
│   │   ├── components/    ← UI components + layout
│   │   ├── hooks/         ← useAuth, useGeolocation, useAttendance
│   │   ├── contexts/      ← AuthContext
│   │   ├── lib/           ← axios, React Query, utils
│   │   └── types/         ← TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       ← Entorno de desarrollo
├── docker-compose.prod.yml  ← Producción
└── README.md
```

## 🔐 Roles y permisos

| Acción | Docente | Secretaría/Admin |
|--------|:-------:|:----------------:|
| Fichar (QR) | ✅ | — |
| Ver propio historial | ✅ | — |
| Ver todos los registros | — | ✅ |
| Gestionar docentes | — | ✅ |
| Gestionar horarios/materias | — | ✅ |
| Generar reportes | — | ✅ |
| Exportar CSV/XLSX | — | ✅ |

## 📊 API Principal

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Obtener tokens JWT |
| `/api/auth/me/` | GET | Usuario actual |
| `/api/attendance/check-in/` | POST | Registrar presencia |
| `/api/attendance/today/` | GET | Resumen del día (admin) |
| `/api/schedules/` | GET/POST | Horarios |
| `/api/subjects/` | GET/POST | Materias |
| `/api/classrooms/` | GET/POST | Aulas |
| `/api/reports/absences/` | GET | Reporte de ausencias |
| `/api/reports/export/` | GET | Exportar CSV/XLSX |
| `/api/qr/{slug}/` | GET | QR code de institución |

## ⚙️ Variables de entorno

### Backend (`backend/.env`)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=fichaje_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

## 🐳 Producción con Docker

```bash
# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con valores de producción

# Construir e iniciar
docker compose -f docker-compose.prod.yml up --build -d

# Crear superusuario
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 🧪 Gestión de comandos útiles

```bash
# Generar QR para todas las instituciones
docker compose exec backend python manage.py generate_qr --base-url https://tu-dominio.com

# Crear datos de prueba
docker compose exec backend python manage.py seed_institutions

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend
```

## 📄 Licencia

MIT
