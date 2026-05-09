# Executive Agenda

Asistente de agenda para ejecutivos — gestión de tareas, eventos, recordatorios y prioridades con sincronización opcional con Google Calendar e integración con OpenAI.

## ¿Qué incluye?

- **Dashboard ejecutivo** — resumen diario, top prioridades, agenda del día y recordatorios próximos
- **Gestión de tareas, eventos y recordatorios** via panel QuickAdd
- **Detección automática de conflictos** en el calendario
- **Sistema de priorización** configurable por pesos (urgencia, impacto, carga)
- **Sincronización con Google Calendar** (opcional)
- **Resumen diario con IA** vía OpenAI (opcional — funciona sin clave con respuestas locales)
- **Autenticación JWT** de un solo usuario (perfil ejecutivo)

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| Estilos | Tailwind CSS |
| Auth | JWT con bcrypt |
| IA | OpenAI GPT-4o-mini (opcional) |
| Calendario | Google Calendar API (opcional) |
| Deploy | Railway |

---

## Instalación local

### 1. Requisitos previos

- Node.js 18+
- Una base de datos PostgreSQL (puedes usar [Supabase](https://supabase.com) gratis)

### 2. Clonar e instalar

```bash
git clone https://github.com/vglena/Executive-Agenda.git
cd Executive-Agenda/agenda-app
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Base de datos (Supabase)
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="<genera con: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\">"

# Acceso ejecutivo
EXECUTIVE_EMAIL="ejecutivo@agenda.local"
EXECUTIVE_PASSWORD_HASH="<genera con: npm run gen:hash -- 'TuContraseña'>"
```

> Las variables de Google Calendar y OpenAI son **opcionales**. Sin ellas el sistema funciona con adaptadores locales.

### 4. Migrar la base de datos

```bash
npx prisma migrate deploy
```

### 5. Arrancar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Generación de credenciales

**JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Hash de contraseña:**
```bash
npm run gen:hash -- "TuContraseña"
# Copia el valor "Base64 para .env" en EXECUTIVE_PASSWORD_HASH
```

---

## Despliegue en Railway

1. Conecta este repositorio en [railway.app](https://railway.app)
2. Establece el **Root Directory** como `agenda-app`
3. Añade las variables de entorno del panel Variables de Railway
4. Railway detecta automáticamente Next.js y despliega

Consulta [`agenda-app/DEPLOYMENT.md`](agenda-app/DEPLOYMENT.md) para instrucciones detalladas.

---

## Estructura del repositorio

```
Executive-Agenda/
├── agenda-app/          # Aplicación Next.js (la app)
│   ├── app/             # Rutas y páginas (App Router)
│   ├── components/      # Componentes UI
│   ├── lib/             # Servicios, adaptadores, utilidades
│   ├── pages/api/       # Endpoints REST
│   ├── prisma/          # Schema y migraciones de BD
│   └── .env.example     # Plantilla de variables de entorno
├── agent/               # Sistema de gestión de proyectos (Project OS)
└── app/                 # Integraciones y servicios del Project OS
```

---

## Licencia

MIT
