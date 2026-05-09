# PRJ-002 — Arquitectura Técnica del MVP
## Asistente IA de Agenda Ejecutiva

> Foco: MVP simple, 1 usuario, rápido de desarrollar, mantenible.
> Sin sobreingeniería. Sin over-engineering.
> Estado: **APROBADO** — 2026-05-08
> Decisión: DEC-007
> Referencias: `prj-002-mvp-signoff.md`, `prj-002-data-model.md`

---

## 1. Stack Recomendado

> Justificación de cada elección al final de la sección.

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (App Router) + TypeScript | 14.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Backend** | Next.js API Routes (mismo proyecto) | 14.x |
| **ORM** | Prisma | 5.x |
| **Base de datos** | PostgreSQL | 16.x |
| **LLM (defecto)** | OpenAI API — gpt-4o-mini | latest |
| **Integración calendario** | Google Calendar API (adaptador opcional) | v3 |
| **Recordatorios** | node-cron (en proceso del servidor Node.js) | 3.x |
| **Autenticación** | JWT hardcoded para 1 usuario | — |
| **Lenguaje** | TypeScript en todo el stack | 5.x |
| **Despliegue** | Railway (app completa) + Supabase (PostgreSQL) | — |

### Por qué este stack y no otro

| Decisión | Alternativa descartada | Razón |
|---------|----------------------|-------|
| Next.js full-stack | Frontend separado (React) + Backend separado (Express) | Para 1 usuario, tener un solo proyecto reduce infraestructura y tiempo de setup. Next.js API Routes es suficiente para el volumen del MVP. |
| Prisma ORM | Drizzle, TypeORM, queries raw | Prisma genera tipos TypeScript desde el schema automáticamente; reduce errores y acelera el desarrollo de operaciones CRUD. |
| PostgreSQL | SQLite, MongoDB | PostgreSQL es relacional, estándar, soportado por Supabase con tier gratuito. SQLite tendría limitaciones en despliegue cloud. MongoDB añade complejidad sin beneficio para este modelo de datos. |
| gpt-4o-mini | GPT-4o, Claude, Gemini | Más barato para uso cotidiano (justificaciones + resumen diario). Intercambiable vía adaptador. Para 1 usuario, el costo es marginal. |
| node-cron (in-process) | BullMQ, Redis, AWS EventBridge | Para 1 usuario no se justifica una cola de mensajes. node-cron corriendo en el servidor Node.js persistente de Railway es suficiente y no añade dependencias. |
| JWT hardcoded | NextAuth, Supabase Auth, Auth0 | Para 1 ejecutivo, un sistema de login simple (email + contraseña) con JWT es todo lo necesario. Evita dependencias externas de auth. |
| Railway | Vercel | Vercel usa funciones serverless que no soportan procesos persistentes. node-cron requiere un servidor Node.js siempre encendido. Railway lo soporta nativamente. |
| Supabase (PostgreSQL) | Railway PostgreSQL, Neon | Supabase ofrece tier gratuito (500MB), interfaz visual del DB, y backup automático. Suficiente para 1 usuario y simple de gestionar. |

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                    Next.js Frontend                         │
│          (React, TypeScript, Tailwind CSS)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (mismo servidor)
┌────────────────────────▼────────────────────────────────────┐
│                   Next.js API Routes                        │
│               /api/tasks  /api/events  /api/reminders       │
│               /api/priorities  /api/summary  /api/auth      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Services    │  │  LLM         │  │  Calendar        │  │
│  │  (lógica de  │  │  Adapter     │  │  Adapter         │  │
│  │  negocio)    │  │  (interface) │  │  (interface)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌────────▼─────────┐  │
│  │    Prisma    │  │  OpenAI      │  │  Google Calendar │  │
│  │    ORM       │  │  Adapter     │  │  Adapter         │  │
│  └──────┬───────┘  │ (defecto)    │  │  (opcional)      │  │
│         │          └──────────────┘  └──────────────────┘  │
│  ┌──────▼─────────────────────────────────────────────────┐ │
│  │              node-cron Scheduler                       │ │
│  │  (proceso en background — dispara recordatorios)       │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼──────┐                 ┌────────▼────────┐
│  Supabase    │                 │   OpenAI API    │
│  PostgreSQL  │                 │   (cloud)       │
│  (cloud)     │                 └─────────────────┘
└──────────────┘
```

**Principio de la arquitectura**: un único proyecto Next.js desplegado como servidor Node.js persistente en Railway. Sin microservicios, sin colas, sin infraestructura compleja. Todo en un repositorio.

---

## 3. Frontend

### Estructura de carpetas

```
/app
  /                    ← Pantalla principal (resumen + prioridades)
  /calendar            ← Vista de calendario (día / semana)
  /tasks               ← Vista de tareas (hoy / pendientes / historial)
  /reminders           ← Vista de recordatorios del día
  /settings            ← Perfil del ejecutivo + configuración
  /login               ← Pantalla de autenticación

/components
  /ui                  ← Componentes atómicos (botones, inputs, badges)
  /calendar            ← EventCard, DayView, WeekView, ConflictBadge
  /tasks               ← TaskCard, QuickAddTask, TaskList
  /reminders           ← ReminderAlert, ReminderList
  /priorities          ← PriorityCard, PriorityList, JustificationBadge
  /summary             ← DailySummaryBlock, SummaryItem

/lib
  /api                 ← Funciones fetch hacia las API Routes propias
  /utils               ← Helpers de fecha, formato, zona horaria
  /hooks               ← React hooks reutilizables (useTasks, useEvents, etc.)
```

### Decisiones de UI

- **App Router de Next.js** — rutas por carpeta, layouts compartidos, Server Components donde aplique.
- **Tailwind CSS** — sin librerías de componentes externas en MVP (reduce dependencias y tiempo de setup).
- **Componentes propios** — solo los necesarios; no instalar Shadcn/UI ni Material UI para el MVP.
- **Sin estado global complejo** — React Context para datos del usuario + SWR para fetching. Sin Redux, sin Zustand en MVP.
- **Responsive básico** — la app debe funcionar en desktop y en tablet. Sin optimización mobile en MVP (excluido del alcance, ver E-03).

---

## 4. Backend

### Estructura de API Routes

```
/api
  /auth
    POST /api/auth/login      ← Recibe email+password → devuelve JWT
    POST /api/auth/logout     ← Invalida token (client-side)

  /events
    GET    /api/events        ← Lista eventos (query: date, range)
    POST   /api/events        ← Crea evento manual
    PUT    /api/events/:id    ← Edita evento
    DELETE /api/events/:id    ← Elimina evento

  /tasks
    GET    /api/tasks         ← Lista tareas (query: status, date)
    POST   /api/tasks         ← Crea tarea
    PUT    /api/tasks/:id     ← Edita tarea
    PATCH  /api/tasks/:id     ← Completa tarea (acción simple)
    DELETE /api/tasks/:id     ← Elimina tarea

  /reminders
    GET    /api/reminders     ← Lista recordatorios del día
    POST   /api/reminders     ← Crea recordatorio
    DELETE /api/reminders/:id ← Cancela recordatorio

  /priorities
    GET    /api/priorities/today        ← Ranking del día (genera si no existe)
    POST   /api/priorities/reject/:taskId ← Rechaza tarea del ranking

  /summary
    GET    /api/summary/today           ← Resumen del día (genera si no existe)

  /calendar
    POST   /api/calendar/connect        ← Inicia OAuth con Google Calendar
    DELETE /api/calendar/disconnect     ← Desconecta Google Calendar
    POST   /api/calendar/sync           ← Fuerza sincronización manual
```

### Estructura de servicios (lógica de negocio)

```
/lib/services
  events.service.ts          ← CRUD de eventos + detección de conflictos
  tasks.service.ts           ← CRUD de tareas + cambio de estado
  reminders.service.ts       ← CRUD de recordatorios + cálculo de hora de disparo
  priorities.service.ts      ← Cálculo de score + generación de ranking
  summary.service.ts         ← Compilación de datos + llamada al LLM
  calendar.service.ts        ← Orquestación de sincronización con proveedor externo
  scheduler.service.ts       ← Inicialización y gestión de node-cron
```

### Reglas del backend

- Toda la lógica de negocio vive en `/lib/services`, no en las API Routes.
- Las API Routes solo reciben, validan y delegan a los servicios.
- Validación de inputs con **Zod** (TypeScript-native, sin dependencias pesadas).
- Errores retornan JSON estructurado: `{ error: string, code: string }`.
- Todos los endpoints requieren JWT válido excepto `POST /api/auth/login`.

---

## 5. Base de Datos

### Schema Prisma (modelo funcional mapeado a tablas)

```prisma
// schema.prisma

model Executive {
  id                    String    @id @default(uuid())
  nombre                String
  zona_horaria          String
  horario_laboral_inicio String   // "08:00"
  horario_laboral_fin   String   // "19:00"
  dias_laborables       String[]  // ["MONDAY","TUESDAY",...]
  hora_resumen_diario   String    // "07:30"
  google_calendar_token Json?     // tokens OAuth cifrados — null si no conectado
  created_at            DateTime  @default(now())
}

model Event {
  id                  String    @id @default(uuid())
  titulo              String
  fecha               DateTime  @db.Date
  hora_inicio         String    // "09:00"
  hora_fin            String    // "10:00"
  descripcion         String?
  origen              String    // "manual" | "google_calendar"
  id_externo          String?   @unique  // ID de Google Calendar — null si manual
  sincronizado        Boolean   @default(false)
  conflicto_detectado Boolean   @default(false)
  estado              String    @default("activo")
  created_at          DateTime  @default(now())
  reminders           Reminder[]
}

model Task {
  id               String    @id @default(uuid())
  titulo           String
  descripcion      String?
  fecha_limite     DateTime? @db.Date
  prioridad_manual String    @default("P3")  // "P1" | "P2" | "P3" | "P4"
  estado           String    @default("pendiente")  // "pendiente" | "completada"
  created_at       DateTime  @default(now())
  completed_at     DateTime?
  reminder         Reminder?
}

model Reminder {
  id                  String    @id @default(uuid())
  entidad_tipo        String    // "tarea" | "evento"
  task_id             String?   @unique
  event_id            String?
  antelacion_tipo     String    // "15min" | "30min" | "1h" | "3h" | "1dia" | "personalizado"
  fecha_hora_disparo  DateTime
  origen              String    @default("usuario")  // "usuario" | "sugerido"
  estado              String    @default("activo")   // "activo" | "disparado" | "cancelado"
  task                Task?     @relation(fields: [task_id], references: [id], onDelete: Cascade)
  event               Event?    @relation(fields: [event_id], references: [id], onDelete: Cascade)
}

model DailyPriority {
  id                    String   @id @default(uuid())
  fecha                 DateTime @db.Date @unique
  tareas_rankeadas      String[] // IDs de tareas en orden
  scores                Json     // { taskId: number }
  justificaciones       Json     // { taskId: string }
  tareas_rechazadas_hoy String[]
  estado                String   @default("vigente")
  generated_at          DateTime @default(now())
  recalculated_at       DateTime?
}

model DailySummary {
  id                  String   @id @default(uuid())
  fecha               DateTime @db.Date @unique
  contenido_completo  String
  eventos_del_dia     String[] // IDs
  tareas_vencidas     String[] // IDs
  tareas_prioritarias String[] // IDs (top 3)
  sugerencia_del_dia  String
  estado              String   @default("generado")
  generated_at        DateTime @default(now())
}
```

### Notas del schema

- **Un solo `Executive`** en la tabla — se crea en el seed de la base de datos, no hay registro.
- **`google_calendar_token`** almacena los tokens OAuth cifrados con una clave de entorno. Nunca en texto plano.
- `fecha` en `Event` y `Task` se almacena en UTC; la conversión a zona horaria del ejecutivo ocurre en el servicio, nunca en la DB.
- `onDelete: Cascade` en `Reminder` — eliminar una tarea o evento borra automáticamente su recordatorio.

---

## 6. Integración Google Calendar

### Principio de desacoplamiento

El resto del sistema **nunca importa el SDK de Google directamente**. Todo pasa por la interface `CalendarProvider`.

```typescript
// /lib/integrations/calendar/types.ts
export interface CalendarEvent {
  externalId: string
  titulo: string
  fecha: string       // "YYYY-MM-DD"
  horaInicio: string  // "HH:MM"
  horaFin: string     // "HH:MM"
  descripcion?: string
}

export interface CalendarProvider {
  isConnected(): Promise<boolean>
  getEvents(from: Date, to: Date): Promise<CalendarEvent[]>
  disconnect(): Promise<void>
}

// /lib/integrations/calendar/google.adapter.ts
export class GoogleCalendarAdapter implements CalendarProvider { ... }

// /lib/integrations/calendar/null.adapter.ts
// Adapter por defecto cuando Google Calendar no está conectado — devuelve [] sin error
export class NullCalendarAdapter implements CalendarProvider { ... }
```

### Flujo de sincronización

```
calendar.service.ts llama a provider.getEvents(hoy, hoy+7)
        │
        ▼
Para cada CalendarEvent recibido:
  ├── ¿Existe Event con id_externo === externalId?
  │       ├── Sí → UPDATE (título, horas, descripción)
  │       └── No → INSERT (origen: "google_calendar", sincronizado: true)
        │
        ▼
Events cancelados en Google → marcar estado: "cancelado" en DB
        │
        ▼
Recalcular conflictos del día (events.service.detectConflicts)
```

### OAuth y seguridad

- El flujo OAuth (`/api/calendar/connect`) redirige a Google Consent Screen.
- El callback de Google devuelve `access_token` + `refresh_token`.
- Los tokens se almacenan cifrados en `Executive.google_calendar_token` usando `AES-256-GCM` con `CALENDAR_ENCRYPTION_KEY` de las variables de entorno.
- Nunca se exponen tokens en la API pública.

---

## 7. Capa IA / LLM

### Principio de intercambiabilidad

El sistema nunca invoca OpenAI directamente desde los servicios. Todo pasa por la interface `LLMAdapter`.

```typescript
// /lib/ai/types.ts
export interface LLMAdapter {
  generateJustifications(tasks: TaskWithScore[]): Promise<Record<string, string>>
  generateDailySummary(context: SummaryContext): Promise<string>
  generateDaySuggestion(context: SummaryContext): Promise<string>
}

// /lib/ai/openai.adapter.ts
export class OpenAIAdapter implements LLMAdapter {
  // usa gpt-4o-mini por defecto
  // model configurable vía env: LLM_MODEL=gpt-4o-mini
}

// Para intercambiar: implementar AnthropicAdapter, GeminiAdapter, etc.
// El resto del sistema no cambia.
```

### Qué genera el LLM (solo 3 campos)

| Campo | Prompt base | Tokens estimados |
|-------|------------|-----------------|
| `justificaciones` | "Explica en 1 frase por qué esta tarea '{titulo}' (deadline: {fecha}, prioridad: {P}) debe atenderse hoy. Carga del día: {N} reuniones. Sé directo y concreto." | ~30 por tarea |
| `sugerencia_del_dia` | "Basado en esta agenda: {eventos} y estas tareas prioritarias: {tareas}, escribe 1 frase de consejo práctico para el ejecutivo para optimizar su día de hoy." | ~40 |
| `contenido_completo` | Prompt estructurado con los 4 bloques del resumen + instrucción de máximo 300 palabras | ~400 |

### Cálculo determinista (sin LLM)

El score de prioridad es **cálculo puro**, sin LLM:

```typescript
function calcularScore(task: Task, eventCount: number): number {
  const urgencia = task.fecha_limite
    ? Math.max(0, 10 - diasHastaDeadline(task.fecha_limite))  // 0–10
    : 3  // sin fecha → score neutro

  const impacto = { P1: 4, P2: 3, P3: 2, P4: 1 }[task.prioridad_manual]  // 1–4

  const cargaPenalizacion = Math.min(eventCount * 0.5, 3)  // max penalización: 3

  return urgencia * 0.5 + impacto * 0.3 + cargaPenalizacion * 0.2
}
```

Los pesos (`0.5 / 0.3 / 0.2`) son configurables vía variables de entorno antes de ajuste fino: `PRIORITY_WEIGHT_URGENCY`, `PRIORITY_WEIGHT_IMPACT`, `PRIORITY_WEIGHT_LOAD`.

---

## 8. Sistema de Recordatorios

### Problema central

Vercel (serverless) no soporta procesos persistentes. **Por eso se despliega en Railway** (servidor Node.js continuo), donde node-cron funciona correctamente.

### Implementación

```typescript
// /lib/services/scheduler.service.ts
// Se inicializa una vez al arrancar el servidor Next.js

import cron from 'node-cron'
import { checkAndFireReminders } from './reminders.service'
import { generateDailyPriorities } from './priorities.service'
import { generateDailySummary } from './summary.service'
import { syncCalendar } from './calendar.service'

export function initScheduler() {
  // Verificar recordatorios cada minuto
  cron.schedule('* * * * *', async () => {
    await checkAndFireReminders()
  })

  // Generar resumen diario y prioridades a la hora configurada
  // Se recalcula si la hora configurada cambia
  cron.schedule('* * * * *', async () => {
    await checkAndTriggerDailyGeneration()
  })

  // Sincronizar Google Calendar cada 15 minutos (si está conectado)
  cron.schedule('*/15 * * * *', async () => {
    await syncCalendar()
  })
}
```

### Flujo de disparo de recordatorio

```
Cron corre cada minuto → checkAndFireReminders()
        │
        ▼
DB: SELECT * FROM Reminder
  WHERE estado = 'activo'
  AND fecha_hora_disparo <= NOW()
        │
        ▼
Para cada recordatorio encontrado:
  ├── Marcar estado = 'disparado' en DB
  └── Crear una entrada en tabla Notification (o flag en DB)
          │
          ▼
El frontend consulta /api/reminders/pending cada 30 seg (polling)
y muestra la alerta in-app al ejecutivo
```

**Nota**: Para el MVP no se implementa WebSocket ni SSE. El frontend hace polling ligero cada 30 segundos para verificar alertas pendientes. Es suficiente para 1 usuario y elimina complejidad de infraestructura de tiempo real.

---

## 9. Autenticación Mínima

### Principio

Para 1 ejecutivo, no se necesita registro, recuperación de contraseña ni OAuth de usuario. El sistema tiene **un solo usuario** creado en el seed inicial.

### Implementación

```typescript
// Variables de entorno:
// EXECUTIVE_EMAIL=ejecutivo@dominio.com
// EXECUTIVE_PASSWORD_HASH=bcrypt_hash_de_la_contraseña
// JWT_SECRET=clave_aleatoria_256_bits

// /api/auth/login
// 1. Recibe { email, password }
// 2. Compara con EXECUTIVE_EMAIL y verifica bcrypt hash
// 3. Si OK → devuelve JWT firmado con expiración de 30 días
// 4. Si KO → 401 Unauthorized

// Middleware de autenticación en todas las rutas /api/*
// excepto /api/auth/login
// Verifica JWT en header Authorization: Bearer <token>
```

### Lo que NO se construye en MVP

- No hay página de registro.
- No hay recuperación de contraseña por email.
- No hay sesiones múltiples ni logout en todos los dispositivos.
- No hay rate limiting en el endpoint de login (1 usuario → riesgo mínimo).

> Si la contraseña se pierde, se regenera el hash y se actualiza la variable de entorno en Railway. Aceptable para un MVP personal.

---

## 10. Despliegue Recomendado

### Infraestructura

```
┌─────────────────────────────────────────────┐
│                  RAILWAY                    │
│                                             │
│  Next.js App (servidor Node.js persistente) │
│  Puerto: 3000                               │
│  node-cron: activo en background            │
│                                             │
│  Variables de entorno:                      │
│  DATABASE_URL                               │
│  JWT_SECRET                                 │
│  OPENAI_API_KEY                             │
│  LLM_MODEL                                 │
│  GOOGLE_CLIENT_ID (opcional)                │
│  GOOGLE_CLIENT_SECRET (opcional)            │
│  CALENDAR_ENCRYPTION_KEY (opcional)         │
│  EXECUTIVE_EMAIL                            │
│  EXECUTIVE_PASSWORD_HASH                    │
│  PRIORITY_WEIGHT_URGENCY                    │
│  PRIORITY_WEIGHT_IMPACT                     │
│  PRIORITY_WEIGHT_LOAD                       │
└────────────────────────┬────────────────────┘
                         │ DATABASE_URL
┌────────────────────────▼────────────────────┐
│               SUPABASE                      │
│         PostgreSQL 16 (cloud)               │
│         Tier gratuito: 500 MB               │
│         Backup automático diario            │
└─────────────────────────────────────────────┘
```

### Proceso de despliegue

| Paso | Acción |
|------|--------|
| 1 | Crear proyecto en Railway, conectar repositorio Git |
| 2 | Crear proyecto en Supabase, obtener `DATABASE_URL` |
| 3 | Configurar todas las variables de entorno en Railway |
| 4 | Ejecutar `prisma migrate deploy` en Railway (primer despliegue) |
| 5 | Ejecutar seed: crear el único usuario ejecutivo en DB |
| 6 | Dominio automático de Railway (ej. `agenda-mvp.railway.app`) |

### Costo estimado del MVP

| Servicio | Tier | Costo mensual |
|---------|------|--------------|
| Railway (Node.js) | Hobby Plan | ~$5 USD/mes |
| Supabase (PostgreSQL) | Free tier | $0 |
| OpenAI API | Pay-per-use | ~$1–3 USD/mes (1 usuario, uso cotidiano) |
| **Total** | | **~$6–8 USD/mes** |

---

## 11. Riesgos Técnicos

| ID | Riesgo | Severidad | Probabilidad | Mitigación |
|----|--------|-----------|-------------|------------|
| RR-013 | Tokens de Google Calendar expuestos si el cifrado está mal configurado | Alto | Baja | Cifrar con AES-256-GCM; nunca exponer en respuestas de API; rotación de clave vía variable de entorno |
| RR-014 | node-cron falla silenciosamente si el servidor de Railway se reinicia | Medio | Media | `initScheduler()` se llama en el arranque del servidor; Railway auto-restart ante caídas; logs de cron obligatorios |
| RR-015 | Supabase free tier alcanza límite de 500 MB con historial de summaries y prioridades | Bajo | Baja | Para 1 usuario, 1 año de uso ≈ 365 summaries + priorities ≈ ~5 MB. No es un riesgo real en el horizonte del MVP |
| RR-016 | La clave `JWT_SECRET` débil o expuesta compromete la sesión del ejecutivo | Alto | Baja | Generar con `openssl rand -base64 32`; almacenar solo en Railway env vars; nunca en el repositorio |
| RR-017 | Polling cada 30 seg para recordatorios consume batería en dispositivos móviles | Bajo | Media | Aceptable para MVP desktop; optimizar con SSE en v2 si se añade app móvil |
| RR-018 | Cambio en la API de OpenAI (deprecación de modelo, cambio de precios) | Medio | Baja | El adaptador LLM permite cambiar de modelo con 1 variable de entorno (`LLM_MODEL`) sin cambios en código |
| RR-019 | Prisma schema drift: migraciones aplicadas en producción sin testear | Medio | Media | Siempre correr `prisma migrate dev` en local antes de `migrate deploy` en producción; nunca editar DB directamente |

---

## 12. Tareas Técnicas Iniciales

> Estas son las tareas de Fase 1 técnica. Máximo 6. Se completarán antes del 2026-05-29.

| # | Tarea | Prioridad | Fecha límite |
|---|-------|-----------|-------------|
| 1 | Inicializar repositorio: Next.js 14 + TypeScript + Tailwind + Prisma | P1 | 2026-05-12 |
| 2 | Definir y aplicar schema Prisma inicial + seed del ejecutivo | P1 | 2026-05-15 |
| 3 | Implementar autenticación JWT (login, middleware de protección de rutas) | P1 | 2026-05-19 |
| 4 | Implementar LLMAdapter (interface + OpenAIAdapter) y PriorityService (score determinista) | P1 | 2026-05-22 |
| 5 | Configurar node-cron scheduler (recordatorios + generación de resumen diario) | P1 | 2026-05-26 |
| 6 | Configurar despliegue en Railway + Supabase + variables de entorno | P1 | 2026-05-29 |

---

## Resumen de la Arquitectura

| Decisión | Elección | Por qué |
|---------|---------|---------|
| **Un solo repo** | Next.js full-stack | 1 usuario, 1 codebase, sin overhead de microservicios |
| **TypeScript end-to-end** | Frontend + Backend + ORM | Consistencia, tipos compartidos, menos errores |
| **Despliegue persistente** | Railway (no Vercel) | node-cron requiere servidor siempre activo |
| **DB gestionada** | Supabase PostgreSQL | Gratis, backup automático, UI de gestión |
| **LLM intercambiable** | Interface + adaptador | Cambiar de OpenAI a Anthropic/Gemini sin tocar servicios |
| **Calendar desacoplada** | CalendarProvider interface | Funciona sin Google; agregar Apple/Outlook sin cambiar servicios |
| **Recordatorios simples** | node-cron + polling | Sin Redis, sin colas; suficiente para 1 usuario |
| **Auth mínima** | JWT + bcrypt + 1 usuario | Sin registro, sin recuperación; personal tool |

---

*Última actualización: 2026-05-08 — Aprobado por el usuario. Desarrollo iniciado.*
