# Decisions Log

> Registro de todas las decisiones importantes tomadas durante la gestión de proyectos.
> Sirve como memoria de por qué se tomó cada camino y quién lo decidió.

---

## Instrucciones de Uso

- Registrar decisiones que afectan el scope, prioridad o dirección de un proyecto
- Incluir siempre el contexto y las alternativas consideradas
- No eliminar entradas — marcar como `[anulada]` si fue revertida
- Usar este log para explicar decisiones pasadas en revisiones futuras

---

## Decisiones Registradas

### [DEC-017] — Producción Actualizada con Rediseño Ejecutivo Mobile-First

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: Producción debe reflejar el estado actual real de `agenda-app` antes de realizar la validación móvil del ejecutivo. Se desplegó el commit `938b214` (`Implement executive mobile UI`) directamente con Railway CLI porque el servicio Railway no expone repositorio GitHub conectado (`source: null`) y el repo local no tiene `origin`.
- **Resultado técnico**:
  - `npx tsc --noEmit` → OK
  - `npm run build` → OK
  - Railway deploy `fa88bc4a-2b7a-41bc-a00c-7fa3c3d986b1` → SUCCESS
  - URL producción: `https://executive-agenda-ai-production.up.railway.app`
  - Healthcheck producción: `status: ok`, DB OK, env vars requeridas OK.
- **Fix de deploy**: `railway.toml` volvió a `buildCommand = "npm run build"` para evitar doble `npm ci` en Nixpacks, que causaba error `EBUSY` sobre `/app/node_modules/.cache`.
- **Verificación UI producción**:
  - Bundle público contiene textos del rediseño: `Preparando tu día`, `foco`, `alertas`, `Captura`, `Guardar`, `Ajuste manual opcional`, `Foco de hoy`.
  - Bundle público no contiene textos antiguos: `TOP 5 PRIORIDADES`, `AÑADIR RÁPIDO`, `Top 5`.
  - `P1/P2/P3` siguen existiendo como señal secundaria en QuickAdd avanzado/API, no como elemento principal del dashboard.
- **Límite**: no se realizó validación real con el ejecutivo en esta sesión. La próxima validación debe hacerse en móvil real/incógnito sobre la URL ya actualizada.
- **Estado**: vigente

---

### [DEC-018] — Cambio de Filosofía UX: de "Foco" a "Agenda Viva Cronológica"

- **Fecha**: 2026-05-10
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: La app abandona el concepto "Foco" como eje central de la experiencia. Se reemplaza por una agenda ejecutiva viva organizada cronológicamente. El usuario debe entender de forma natural qué tiene ahora, qué viene después, qué tiene hoy, qué se acerca en próximos días, qué debe preparar y qué tareas puede gestionar.
- **Cambios concretos**:
  - "Foco" → "Mi día" en navegación, headers y microcopy global
  - Dashboard reordenado: Briefing hero → Agenda de hoy → Próximos días → Tareas abiertas → Capturar → Resumen del día
  - Elementos pasados NO se muestran como "atrasados" en el flujo principal
  - Tareas con deadline pasado se mueven al final (colapsadas, etiqueta neutra)
  - `TopPrioridades` (tarjeta con ranking) eliminada del dashboard
  - `ProximosDias` nuevo componente: eventos de los próximos 3 días
  - `priorities/page.tsx` rediseñado: grupos temporales (Hoy/Mañana/Esta semana/Más adelante), sin score ni #posición
  - Tareas: edición y borrado desde UI (inline en TareasPendientes)
  - Eliminado lenguaje técnico: "score", "ranking", "prioridad manual", "foco operativo", "bloqueando el día"
  - ExecutiveBrief: stat "foco" → "tareas"
- **Alternativas consideradas**: Mantener "Foco" como sección separada — descartada porque el ejecutivo no entiende el concepto de forma natural.
- **Impacto**: UX más intuitiva, menos jerga técnica, narrativa temporal clara. Backend sin cambios.
- **Estado**: vigente

---

### [DEC-001] — Iniciar con MVP Simple para el Asistente IA de Agenda Ejecutiva
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: El proyecto arranca con un MVP simple centrado en centralizar reuniones, prioridades, tareas y recordatorios. No se construye el sistema completo desde el inicio.
- **Contexto**: El usuario quiere validar el concepto y tener algo funcional en 4 meses. Construir el sistema completo desde el principio sería más lento y arriesgaría no tener nada útil en el deadline.
- **Alternativas consideradas**:
  - Opción A: Sistema completo desde el inicio — descartada por riesgo de no llegar al deadline y por sobreingeniería prematura.
  - Opción B: MVP simple con funcionalidades core — elegida por velocidad de validación y bajo riesgo de scope creep inicial.
- **Impacto esperado**: Entrega de un sistema funcional en 4 meses que puede escalarse en iteraciones posteriores.
- **Estado**: vigente

---

### [DEC-016] — Prioridad Manual Pasa a Señal Secundaria

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: El ejecutivo no debe clasificar manualmente cada actividad como flujo principal. La app debe calcular automáticamente el foco operativo según proximidad temporal, deadline, hora del día, carga de agenda, conflictos, recordatorios próximos, tareas vencidas y actividad del día.
- **Cambios aprobados**: Reducir protagonismo de P1/P2/P3 en interfaz, mover prioridad manual a campo avanzado opcional, usar lenguaje de `foco`, `requiere atención`, `próximo` y `urgente`, y mostrar por qué algo aparece destacado.
- **Impacto técnico**: No se elimina el campo `prioridad_manual` ni se cambia schema. Se mantiene compatibilidad con datos existentes y endpoints actuales. La fórmula de score reduce el peso manual y aumenta señales operativas.
- **Estado**: vigente

---

### [DEC-015] — UI-01 Activada: Rediseño Ejecutivo Mobile-First

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: Activar la fase `UI-01 — Rediseño ejecutivo mobile-first` para convertir el MVP técnico en una experiencia premium para ejecutivo móvil, sin tocar backend ni lógica funcional.
- **Objetivo**: Mejorar experiencia, estética, claridad, flujo móvil, jerarquía visual, velocidad percibida y sensación de asistente ejecutivo inteligente.
- **Alcance inicial aprobado**: Fase 1 visual + primera versión del dashboard mobile-first: `globals.css`, sistema visual base, `Card`, `Badge`, estados vacíos, nuevo `ExecutiveBrief`, reordenación del dashboard, briefing arriba y Top prioridades reducido a Top 3 en dashboard.
- **Restricciones**: No cambiar backend, endpoints, APIs públicas ni lógica funcional; mantener Tailwind y arquitectura actual; no rehacer toda la UI de golpe.
- **Estado**: vigente

### [DEC-002] — Alcance del MVP v1 Congelado
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: El MVP v1 incluye exactamente 5 módulos (calendario, tareas, recordatorios, priorización IA, resumen diario) y está diseñado para un único usuario. El alcance queda congelado para evitar scope creep.
- **Contexto**: El usuario especificó los módulos necesarios y confirmó que el sistema es para una sola persona. Congelar el alcance en este punto activa el proceso de diseño técnico y mitiga RR-001.
- **Alternativas consideradas**:
  - Incluir integración con Slack/Teams desde el MVP — descartada, fuera del alcance v1.
  - Incluir app móvil — descartada, fuera del alcance v1.
  - Multi-usuario — descartado, usuario único en v1.
- **Impacto esperado**: El equipo puede diseñar la arquitectura técnica con un alcance preciso y estable. Reduce riesgo de retrabajo.
- **Estado**: vigente

### [DEC-003] — Especificación Funcional del MVP Elaborada y Congelada
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: La especificación funcional completa del MVP (7 secciones: alcance, funcionalidades incluidas/excluidas, user stories, tareas F1, riesgos funcionales y criterios de aceptación) ha sido elaborada y congelada. Ninguna funcionalidad nueva entra al MVP v1 sin una decisión explícita del usuario.
- **Contexto**: El usuario confirmó los 5 módulos del MVP y quiso cerrar el alcance funcional antes de cualquier decisión técnica. Este documento es la referencia de verdad funcional del proyecto.
- **Alternativas consideradas**:
  - Continuar directamente con decisiones técnicas sin cerrar el alcance funcional — descartada, genera retrabajo de arquitectura.
  - Crear la especificación de forma menos detallada — descartada, los criterios de aceptación son necesarios para el testing.
- **Impacto esperado**: El equipo puede diseñar la arquitectura técnica con un alcance funcional estático, preciso y verificable. Reduce RR-001 y RR-004.
- **Referencia**: `agent/memory/prj-002-mvp-spec.md`
- **Estado**: vigente

### [DEC-004] — Modelo de Datos Funcional del MVP Definido
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: planning_agent + usuario
- **Decisión**: El modelo de datos funcional del MVP queda definido con 6 entidades (Ejecutivo, Evento, Tarea, Recordatorio, PriorizaciónDiaria, ResumenDiario), 50 campos, 24 reglas funcionales y 5 riesgos del modelo identificados (RR-008 a RR-012). Solo 3 campos requieren LLM; 4 son cálculo determinista.
- **Contexto**: Necesario completar el diseño funcional antes de pasar a decisiones técnicas de stack y base de datos.
- **Alternativas consideradas**:
  - Modelar historial de tareas completadas como entidad separada — descartado para MVP; se mantiene como campo en Tarea.
  - Permitir múltiples recordatorios por tarea — descartado para MVP; máximo 1 activo por tarea en v1.
  - Incluir entidad Perfil de Trabajo para calibrar la IA — descartado para MVP; se resuelve con el campo `prioridad_manual` en Tarea.
- **Impacto esperado**: El equipo técnico puede diseñar el schema de base de datos y la arquitectura con un modelo funcional estable y verificable.
- **Referencia**: `agent/memory/prj-002-data-model.md`
- **Estado**: vigente

### [DEC-005] — Google Calendar Pasa a Integración Opcional
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: Google Calendar deja de ser una dependencia implícita del sistema. Los eventos manuales son la funcionalidad core del calendario. Google Calendar es una capa de sincronización externa opcional que el ejecutivo puede activar o desactivar en cualquier momento. El sistema opera íntegramente sin ella.
- **Contexto**: El ejecutivo no debe depender de una cuenta Google para usar el sistema. La dependencia de un proveedor externo representaba un riesgo de disponibilidad (RR-013) y una barrera de adopción innecesaria.
- **Alternativas consideradas**:
  - Mantener Google Calendar como fuente primaria de eventos — descartada, genera dependencia crítica de un proveedor externo.
  - Eliminar Google Calendar completamente del MVP — descartada, la sincronización aporta valor real cuando está disponible.
- **Impacto esperado**: El sistema es 100% funcional sin conexión externa. Elimina RR-013 como riesgo activo una vez validado en testing. Simplifica el onboarding.
- **Cambios aplicados**:
  - Entidad Evento: añadidos campos `proveedor_externo`, `sincronizado`; `id_externo` aclarado como nullable
  - Reglas: R-06 actualizada; añadidas R-25, R-26, R-27
  - Flujos: añadidos F6 (uso sin GCal) y F7 (conectar/desconectar)
  - Spec funcional: alcance y módulo Calendario actualizados
  - Sección 10 de arquitectura funcional añadida al modelo de datos
- **Estado**: vigente

### [DEC-006] — Sign-Off Funcional del MVP Aprobado
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: El diseño funcional completo del MVP queda aprobado y congelado. Incluye: 5 módulos, 29 funcionalidades, 14 exclusiones, 5 flujos de usuario, 6 entidades de datos, 24 reglas funcionales, 20 criterios de aceptación P1/P2, 1 criterio global de sistema y 12 riesgos identificados. El siguiente paso es el diseño de arquitectura técnica.
- **Contexto**: Se completó el ciclo de diseño funcional (requisitos → spec → flujos → modelo de datos → sign-off). El equipo necesita un cierre formal antes de entrar en decisiones técnicas para evitar ambigüedad durante el diseño del stack.
- **Alternativas consideradas**:
  - Continuar iterando el diseño funcional antes del sign-off — descartado, el nivel de detalle es suficiente para comenzar la arquitectura.
  - Hacer sign-off parcial por módulo — descartado, el modelo de datos requiere una visión completa del sistema.
- **Impacto esperado**: El equipo técnico puede diseñar stack, base de datos e integraciones con un alcance funcional estable, verificable y sin cambios pendientes.
- **Referencia**: `agent/memory/prj-002-mvp-signoff.md`
- **Estado**: vigente

### [DEC-007] — Arquitectura Técnica del MVP Definida
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: planning_agent + usuario
- **Decisión**: Stack seleccionado: Next.js 14 (full-stack) + TypeScript + Tailwind CSS + Prisma + PostgreSQL (Supabase) + OpenAI gpt-4o-mini + node-cron + JWT. Despliegue en Railway (servidor persistente, ~$6-8 USD/mes). LLM y Google Calendar desacoplados vía interfaces intercambiables.
- **Contexto**: Stack debe ser simple, rápido de desarrollar y adecuado para 1 usuario. Se prioriza TypeScript en todo el stack (consistente con el repo existente). Vercel fue descartado porque node-cron requiere servidor persistente.
- **Alternativas consideradas**:
  - FastAPI (Python) + React separado — descartado: dos lenguajes, más setup, ecosistema TS ya existente en el repo.
  - Vercel + Vercel Cron Jobs — descartado: frecuencia mínima insuficiente para recordatorios en tier gratuito.
  - Express.js standalone + CRA — descartado: más boilerplate que Next.js sin ventajas para el MVP.
  - SQLite — descartado: limitaciones en despliegue cloud y sin UI de gestión.
- **Impacto esperado**: El equipo puede arrancar el desarrollo con un stack conocido, bien documentado, con tipos compartidos entre frontend y backend, y a un costo inferior a $10 USD/mes.
- **Referencia**: `agent/memory/prj-002-tech-architecture.md`
- **Estado**: vigente

### [DEC-008] — Desviación de Versión: Prisma 5 → Prisma 7.8.0

- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: agente (durante inicialización del repositorio)
- **Decisión**: Aceptar Prisma 7.8.0 como versión de producción del MVP (en lugar de Prisma 5.x especificada en la arquitectura).
- **Arquitectura original**: Prisma 5.x
- **Implementación real**: Prisma 7.8.0
- **Motivo**: npm instaló la versión más reciente disponible (`npm install prisma`) — comportamiento por defecto sin fijar versión exacta.
- **Impacto**: Bajo. Cambio de API: la URL de conexión ya no va en `schema.prisma` (campo `url`) sino en `prisma.config.ts`. El cliente `@prisma/client` y todos los modelos funcionan igual. No hay cambio en la interface pública ni en los servicios.
- **Acción tomada**:
  - `datasource db` en `schema.prisma` sin campo `url` (Prisma 7 lo lee de `prisma.config.ts`).
  - `prisma.config.ts` ya generado por `prisma init` con `datasource.url: process.env.DATABASE_URL`.
  - `PrismaClient` en `lib/db.ts` sin parámetro `datasourceUrl` — el cliente lee `DATABASE_URL` del entorno automáticamente.
- **Riesgo residual**: Ninguno identificado para el MVP de 1 usuario.
- **Estado**: Aceptada

### [DEC-009] — Uso de @prisma/adapter-pg para conexión en Prisma 7
- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: agente (durante ejecución del seed)
- **Decisión**: Usar `@prisma/adapter-pg` con el paquete `pg` como driver adapter para instanciar `PrismaClient` en Prisma 7.
- **Contexto**: En Prisma 7, cuando no hay `url` en `schema.prisma`, `new PrismaClient()` sin opciones lanza `PrismaClientInitializationError`. El cliente requiere o bien un `adapter` (driver adapter) o `accelerateUrl`. Se eligió `@prisma/adapter-pg` por ser el adapter oficial para PostgreSQL en conexión directa.
- **Impacto**: Bajo. Se añaden 2 dependencias (`@prisma/adapter-pg`, `pg`). El API externo de Prisma no cambia. Todos los modelos, servicios y queries son idénticos.
- **Cambios en código**:
  - `lib/db.ts`: instancia `PrismaPg` con `DATABASE_URL` y lo pasa al constructor de `PrismaClient`.
  - `prisma/seed.ts`: mismo patrón.
- **Estado**: Aceptada

*Última actualización: 2026-05-09 — DEC-011 cierre formal F1*

---

### [DEC-010] — EXECUTIVE_PASSWORD_HASH almacenado en base64

- **Fecha**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: agente (durante pruebas de login)
- **Decisión**: Almacenar el hash bcrypt de la contraseña en base64 en los archivos `.env`. El route de login decodifica con `Buffer.from(b64, 'base64').toString('utf-8')` antes de `bcrypt.compare()`.
- **Contexto**: `@next/env` usa `dotenv-expand` internamente. Los hashes bcrypt comienzan con `$2b$12$...`; el `$` es interpretado como referencia a variable de entorno, resultando en una cadena vacía. La codificación base64 evita este problema sin cambiar la lógica de seguridad.
- **Alternativas consideradas**:
  - Usar comillas simples en `.env` — no soportado por `dotenv-expand` en Windows.
  - Escapar `$` con `\$` — funciona en Linux/macOS pero no en Windows PowerShell dotenv.
  - Usar `EXECUTIVE_PASSWORD` en texto plano — descartado por seguridad.
- **Script de generación**: `npm run gen:hash -- "Contraseña"` → copia el valor "Base64 para .env".
- **Estado**: Aceptada

### [DEC-011] — F1 Cerrada Formalmente
- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: La Fase 1 del MVP se cierra formalmente. Las 12 tareas de F1 están completadas, el build de producción es limpio (0 errores TypeScript), el healthcheck responde `{status:ok, db:ok}` y la infraestructura Railway+Supabase está configurada. Se inicia la planificación de F2.
- **Entregables de F1 (12/12)**:
  1. Requisitos MVP definidos y congelados
  2. Especificación funcional del MVP (5 módulos, 29 funcionalidades)
  3. Flujos de usuario (5 módulos)
  4. Modelo de datos funcional (6 entidades, 24 reglas)
  5. Sign-off funcional aprobado (DEC-006)
  6. Arquitectura técnica definida (DEC-007)
  7. Repositorio Next.js 14 + TypeScript + Tailwind + Prisma inicializado
  8. Schema Prisma migrado + seed ejecutivo en Supabase
  9. Auth JWT: `/api/auth/login` + `withAuth` middleware + session helpers
  10. LLMAdapter (interface + OpenAIAdapter + NullLLMAdapter) + PriorityService
  11. node-cron scheduler (3 jobs: reminders, daily-generation, calendar-sync)
  12. Despliegue Railway: `railway.toml`, `/api/health`, `DEPLOYMENT.md`, `start:prod`
- **Criterios técnicos cumplidos**: `npx tsc --noEmit` → 0 errores · `npm run build` → prod limpio · verify:priorities → 20/20 OK · verify:scheduler → 14/14 OK · healthcheck → `{status:ok, db:ok}`
- **Estado**: vigente

---

### [DEC-012] — Fix build: export const dynamic + pages/ error pages

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: agente (corrección técnica)
- **Decisión**: Aplicar dos correcciones mínimas para que `npm run build` termine sin errores:
  1. `export const dynamic = "force-dynamic"` en `app/layout.tsx` — deshabilita prerendering estático global en el App Router.
  2. Crear `pages/_document.tsx`, `pages/404.tsx`, `pages/500.tsx` — provee error pages propias del Pages Router sin usar `<Html>` de `next/document` (que falla por el singleton HtmlContext en Next.js 14.2.x cuando se renderiza con el worker del App Router).
- **Contexto**: `npm run build` fallaba en dos fases distintas:
  - Fase 1 (App Router): `TypeError: Cannot read properties of null (reading 'useContext')` — React dispatcher es `null` durante el prerendering estático de páginas `'use client'` con hooks de `next/navigation`. Solución: `force-dynamic` evita el prerendering.
  - Fase 2 (Pages Router): `Error: <Html> should not be imported outside of pages/_document` — la función `Q()` en `pages.runtime.prod.js` lee un contexto (`HtmlContext`) que solo tiene valor cuando Next.js ejecuta el documento dentro de su propio pipeline de renderizado. El worker del App Router carga una instancia separada del runtime, por lo que el contexto es siempre `undefined`. Solución: usar `<html>` nativo en lugar de `<Html>` del componente de Next.js.
- **Alternativas consideradas**:
  - `esmExternals: false` en `next.config.mjs` — no resolvió el problema de HtmlContext.
  - Upgrade de Next.js — descartado por riesgo de regresión en F2 ya validada.
  - `output: 'standalone'` — cambiaría la configuración de despliegue Railway, descartado.
- **Impacto**: `npm run build` → exit code 0. Todos los smoke tests siguen pasando (9/9 + 13/13). Cero cambios en lógica funcional.
- **Estado**: vigente

---

### [DEC-013] — F3 Cerrada Formalmente + F4 Activada

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: usuario
- **Decisión**: La Fase 3 del MVP se cierra formalmente. Las 6 tareas están completadas, 13/13 suites de tests pasan, build limpio, y el sistema supera 35 checks de estabilidad production-like. Se activa la Fase 4 con foco en despliegue final y lanzamiento.
- **Entregables de F3 (6/6)**:
  1. **F3-01** — Google OAuth 2.0: flujo completo (authorize → callback → token cifrado en DB). `/api/auth/google`, `/api/auth/google/callback`. Token cifrado con AES-256-GCM (`GOOGLE_TOKEN_ENCRYPTION_KEY`). 11/11 tests ✓
  2. **F3-02** — Sync Google Calendar → DB: sincronización unidireccional, deduplicación por `id_externo`, `/api/calendar/sync`, `/api/calendar/status`. 7/7 tests ✓
  3. **F3-03** — Resolución de conflictos: detección de solapamientos, UI de resolución, `/api/calendar/conflicts`. 11/11 tests ✓
  4. **F3-04** — Suite tests integración + carga: 32/32 integración E2E + 8/8 carga (p95=204ms, sin errores a 10 usuarios). Scripts `verify-integration.ts`, `verify-load.ts`, `verify-all.ts`.
  5. **F3-05** — Hardening OWASP: rate limit (10/15min), CSP, X-Frame-Options, HSTS (prod), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, JWT 8h, sanitizeText en schemas Zod, middleware Edge, errores internos ocultos. 32/32 security checks ✓
  6. **F3-06** — Estabilidad producción: `/api/health` mejorado (DB latency + scheduler + env vars), `verify-production.ts` (7 bloques, 35 checks). 13/13 suites `verify:all:fast` ✓
- **Criterios técnicos cumplidos**: `npx tsc --noEmit` → 0 errores · `npm run build` → exit 0 · `verify:all:fast` → 13/13 · `verify:production` → 35/35 · rate limiter: IP-aislado entre suites (X-Forwarded-For ficticio en verify-security)
- **Plan F4 aprobado**: 6 tareas, target 2026-05-28. Enfoque: env vars prod Railway, deploy, dominio+HTTPS, validación real del ejecutivo, monitoreo, go-live.
- **Estado**: vigente

---

### [DEC-014] — F4-01 y F4-02 Completadas — App Live en Railway

- **Fecha**: 2026-05-09
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Decidido por**: sistema (ejecución agente)
- **Decisión**: F4-01 (deploy Railway) y F4-02 (smoke test remoto) completadas. El sistema está live en producción real.
- **URL de producción**: `https://executive-agenda-ai-production.up.railway.app`
- **Variables configuradas en Railway (12/12)**:
  - `DATABASE_URL`, `DIRECT_URL` — Supabase PostgreSQL
  - `JWT_SECRET`, `JWT_EXPIRY=8h`
  - `EXECUTIVE_EMAIL`, `EXECUTIVE_PASSWORD_HASH`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_TOKEN_ENCRYPTION_KEY`
  - `ALLOWED_ORIGIN=https://executive-agenda-ai-production.up.railway.app`
  - `NODE_ENV=production`
- **Fix técnico clave**: `lib/db.ts` reescrito con patrón Proxy lazy — previene inicialización de Prisma en `next build` cuando `DATABASE_URL` puede no estar disponible en build time. Alternativas rechazadas: `output: standalone`, `SKIP_ENV_VALIDATION`, mocks de build.
- **Resultado verify:production remoto**: 35/35 checks ✓ · 1 advertencia no crítica (email Google Calendar no retornado en `/api/calendar/status`)
- **Healthcheck producción**: `{ status: ok, database: ok (146ms), env_vars: ok, environment: production }`
- **Pendiente F4-03..F4-06**: dominio custom, validación ejecutivo, monitoreo, go-live formal.
- **Estado**: vigente
