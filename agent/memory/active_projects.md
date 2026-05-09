# Active Projects

> Fuente de verdad cognitiva sobre todos los proyectos actualmente en curso.
> Este archivo es la referencia principal del sistema — no ClickUp.
> Actualizar al inicio y al cierre de cada sesión relevante.

---

## Instrucciones de Uso

- Cada proyecto tiene un bloque con ID único (`PRJ-XXX`)
- Los campos de ClickUp (`Space ID`, `Folder ID`, `List ID`) son opcionales — se completan cuando el proyecto se sincroniza
- Mover proyectos finalizados a `completed_projects.md`
- Los `ClickUp Task ID` de cada tarea se agregan tras la sincronización con `operations_agent`
- Registrar cambios importantes en `Decisions` o en `decisions_log.md`

---

## Project Template

```markdown
## [Project Name]

- **Project ID**: PRJ-XXX
- **Project Name**: [nombre completo del proyecto]
- **Description**: [qué es este proyecto en 1-2 líneas]
- **Objective**: [resultado concreto al finalizar — medible]
- **Status**: [activo / en pausa / bloqueado / completado]
- **Priority**: [P1 / P2 / P3 / P4]
- **Start Date**: YYYY-MM-DD
- **Target Date**: YYYY-MM-DD
- **ClickUp Space ID**: [ID o null]
- **ClickUp Folder ID**: [ID o null]
- **ClickUp List ID**: [ID o null]

### Main Milestones
- [ ] [Nombre del hito] — [fecha] — [fase]
- [ ] [Nombre del hito] — [fecha] — [fase]

### Active Tasks
| Task | Phase | Priority | Due Date | Status | ClickUp ID |
|------|-------|----------|----------|--------|------------|
| [nombre] | F1 | P1 | YYYY-MM-DD | pendiente | null |

### Risks
- Ver `risks_log.md` — filtrar por [Project ID]
- [O registrar riesgos activos brevemente aquí si son pocos]

### Decisions
- YYYY-MM-DD: [decisión tomada — contexto breve]
- Ver `decisions_log.md` — filtrar por [Project ID]

### Next Actions
- [ ] [Próxima acción concreta] — [responsable o agente] — [fecha]
- [ ] [Próxima acción concreta] — [responsable o agente] — [fecha]

### Last Sync
- **Fecha**: YYYY-MM-DD
- **Sincronizado por**: [operations_agent / manual]
- **Resultado**: [OK / errores — detallar]
```

---

## Proyectos Activos

---

## PRJ-001 — Rediseño del Sitio Web Corporativo

- **Project ID**: PRJ-001
- **Project Name**: Rediseño del Sitio Web Corporativo
- **Description**: Actualización completa del sitio web público de la empresa, incluyendo nuevo diseño visual, estructura de contenidos y optimización SEO.
- **Objective**: Lanzar el nuevo sitio web antes del 2026-07-31 con un score de Lighthouse ≥ 90 en performance y accesibilidad.
- **Status**: activo
- **Priority**: P1
- **Start Date**: 2026-05-08
- **Target Date**: 2026-07-31
- **ClickUp Space ID**: null
- **ClickUp Folder ID**: null
- **ClickUp List ID**: null

### Main Milestones
- [ ] Wireframes aprobados por el cliente — 2026-05-30 — Fase 1
- [ ] Diseño visual finalizado — 2026-06-20 — Fase 2
- [ ] Desarrollo completado y en staging — 2026-07-15 — Fase 3
- [ ] Lanzamiento en producción — 2026-07-31 — Fase 4

### Active Tasks
| Task | Phase | Priority | Due Date | Status | ClickUp ID |
|------|-------|----------|----------|--------|------------|
| Auditoría del sitio actual | F1 | P1 | 2026-05-14 | pendiente | null |
| Definir arquitectura de información | F1 | P1 | 2026-05-20 | pendiente | null |
| Crear wireframes de páginas principales | F1 | P2 | 2026-05-28 | pendiente | null |
| Diseñar sistema de componentes UI | F2 | P2 | 2026-06-10 | pendiente | null |
| Revisar y aprobar diseños con cliente | F2 | P1 | 2026-06-20 | pendiente | null |
| Implementar páginas en staging | F3 | P2 | 2026-07-10 | pendiente | null |
| Pruebas de rendimiento y accesibilidad | F3 | P1 | 2026-07-14 | pendiente | null |

### Risks
- Aprobación del cliente puede retrasar el paso de Fase 1 a Fase 2
- Recursos de desarrollo no confirmados para Fase 3
- Ver `risks_log.md` — PRJ-001

### Decisions
- 2026-05-08: Proyecto creado. Se priorizó sobre otros proyectos pendientes por fecha de lanzamiento comprometida con el cliente.

### Next Actions
- [ ] Iniciar auditoría del sitio actual — planning_agent — 2026-05-14
- [ ] Confirmar disponibilidad del equipo de desarrollo — project_manager_agent — 2026-05-12

### Last Sync
- **Fecha**: null
- **Sincronizado por**: null
- **Resultado**: No sincronizado aún — `ClickUp List ID` pendiente de configurar

---

## PRJ-002 — Asistente IA de Agenda Ejecutiva

- **Project ID**: PRJ-002
- **Project Name**: Asistente IA de Agenda Ejecutiva
- **Description**: Sistema de inteligencia artificial que centraliza reuniones, prioridades, tareas y recordatorios en un asistente conversacional para un ejecutivo. Usuario único.
- **Objective**: Lanzar un MVP funcional (calendario, tareas, recordatorios, priorización IA, resumen diario) para un solo ejecutivo antes del 2026-09-08.

### MVP Scope (v1 — congelado 2026-05-08)
> Usuario: 1 persona (ejecutivo). Sin multi-tenant, sin roles, sin colaboración.

| Módulo | Descripción | Prioridad |
|--------|-------------|----------|
| **Calendario** | Visualización y gestión de reuniones; sincronización con Google Calendar | P1 |
| **Tareas** | Creación, edición y seguimiento de tareas con fechas y estados | P1 |
| **Recordatorios** | Alertas configurables por fecha/hora para tareas y eventos | P1 |
| **Priorización IA** | Motor que sugiere qué atender primero según urgencia, impacto y contexto | P1 |
| **Resumen diario** | Briefing automático cada mañana con agenda, tareas pendientes y prioridades del día | P2 |

> Fuera del MVP: colaboración, multi-usuario, integraciones con Slack/Teams, app móvil, análisis histórico.
- **Status**: activo
- **Priority**: P1
- **Start Date**: 2026-05-08
- **Target Date**: 2026-05-28
- **ClickUp Space ID**: null
- **ClickUp Folder ID**: null
- **ClickUp List ID**: null

### Main Milestones
- [x] Arquitectura técnica y alcance del MVP validados — 2026-05-09 — Fase 1 ✓
- [x] MVP core funcionando (agenda, tareas, recordatorios) — 2026-07-24 — Fase 2 ✓
- [x] Integraciones externas validadas y sistema estable — 2026-05-09 — Fase 3 ✓
- [x] Sistema desplegado y en uso real — 2026-05-28 — Fase 4 (parcial: URL activa, F4-03..F4-06 pendientes)

### Active Tasks
| Task | Phase | Priority | Due Date | Status | ClickUp ID |
|------|-------|----------|----------|--------|------------|
| Definir requisitos del MVP (funcionalidades v1) | F1 | P1 | 2026-05-08 | completada | null |
| Elaborar especificación funcional del MVP | F1 | P1 | 2026-05-08 | completada | null |
| Mapear flujos de usuario principales (5 módulos) | F1 | P1 | 2026-05-08 | completada | null |
| Definir modelo de datos funcional (entidades y relaciones) | F1 | P1 | 2026-05-08 | completada | null |
| Validar especificación funcional con el usuario (sign-off) | F1 | P1 | 2026-05-08 | completada | null |
| Diseñar arquitectura técnica (stack, LLM, APIs, DB) | F1 | P1 | 2026-05-08 | completada | null |
| Inicializar repositorio (Next.js + TypeScript + Tailwind + Prisma) | F1 | P1 | 2026-05-12 | completada | null |
| Definir schema Prisma + seed del ejecutivo | F1 | P1 | 2026-05-08 | completada | null |
| Implementar autenticación JWT (login + middleware) | F1 | P1 | 2026-05-19 | completada | null |
| Implementar LLMAdapter (interface + OpenAIAdapter) + PriorityService | F1 | P1 | 2026-05-22 | completada | null |
| Configurar node-cron scheduler (recordatorios + resumen diario) | F1 | P1 | 2026-05-26 | completada | null |
| Configurar despliegue en Railway + Supabase | F1 | P1 | 2026-05-29 | completada | null |
| [F2-01] CRUD API de Tareas (/api/tasks) | F2 | P1 | 2026-06-06 | completada | null |
| [F2-02] CRUD API de Eventos (/api/events) | F2 | P1 | 2026-06-13 | completada | null |
| [F2-03] CRUD API de Recordatorios (/api/reminders) | F2 | P1 | 2026-06-20 | completada | null |
| [F2-04] Dashboard UI — vista principal | F2 | P1 | 2026-07-04 | completada | null |
| [F2-05] Formularios quick-add (tareas/eventos/recordatorios) | F2 | P1 | 2026-07-11 | completada | null |
| [F2-06] Vista de prioridades y resumen diario | F2 | P2 | 2026-07-18 | completada | null |
| [F3-01] Configurar Google OAuth 2.0 + token store | F3 | P1 | 2026-07-25 | completada | null |
| [F3-02] Sync unidireccional Google Calendar → DB | F3 | P1 | 2026-08-01 | completada | null |
| [F3-03] Resolver conflictos eventos Google vs manuales | F3 | P1 | 2026-08-15 | completada | null |
| [F3-04] Suite de tests de integración y carga | F3 | P1 | 2026-08-14 | completada | null |
| [F3-05] Hardening de seguridad y revisión OWASP | F3 | P1 | 2026-08-21 | completada | null |
| [F3-06] Validación de estabilidad en producción (Railway) | F3 | P2 | 2026-08-28 | completada | null |
| [F4-01] Configurar variables de entorno en Railway (producción real) | F4 | P1 | 2026-05-16 | completada | null |
| [F4-02] Despliegue inicial en Railway + smoke test remoto | F4 | P1 | 2026-05-16 | completada | null |
| [F4-03] Configurar dominio público + HTTPS en Railway | F4 | P2 | 2026-05-20 | pendiente | null |
| [F4-04] Sesión de validación real del ejecutivo (uso guiado) | F4 | P1 | 2026-05-23 | pendiente (revalidar UI nueva) | null |
| [F4-05] Monitoreo básico: uptime check + alertas Railway | F4 | P2 | 2026-05-23 | pendiente | null |
| [F4-06] Go-live formal + guía de acceso del ejecutivo | F4 | P1 | 2026-05-28 | pendiente | null |

### Risks
- Scope creep del MVP — riesgo de que el alcance crezca durante el desarrollo
- Dependencia de APIs externas (Google Calendar, email) con cambios inesperados
- Costo o latencia del LLM en uso real supera lo previsto
- Ver `risks_log.md` — PRJ-002

### Decisions
- 2026-05-08: Proyecto creado. Se elige comenzar con MVP simple para validar el concepto antes de escalar.
- 2026-05-08: Alcance del MVP definido y congelado (5 módulos, usuario único). Ver DEC-002.
- 2026-05-08: Flujos de usuario de los 5 módulos mapeados. Ver `prj-002-user-flows.md`.
- 2026-05-08: Modelo de datos funcional definido (6 entidades, 52 campos, 27 reglas funcionales). Ver DEC-004 y `prj-002-data-model.md`.
- 2026-05-08: Google Calendar pasa a integración opcional; eventos manuales son funcionalidad core. Ver DEC-005.
- 2026-05-08: Arquitectura técnica definida. Stack: Next.js 14 + TypeScript + Prisma + PostgreSQL + OpenAI + Railway + Supabase. Ver DEC-007 y `prj-002-tech-architecture.md`.
- 2026-05-09: F1 cerrada formalmente. 12/12 tareas completadas. Build prod limpio. Healthcheck OK. Ver DEC-011.
- 2026-05-08: Prisma 7 requiere @prisma/adapter-pg para instanciar el cliente. Ver DEC-008 y DEC-009.
- 2026-05-09: F4-04 completada. Validación ejecutivo en producción: todos los módulos funcionales. 3 bugs UX detectados y corregidos: datos de test en DB (10 tareas + 2 eventos limpiados), Markdown sin renderizar en ResumenDiario, capitalización incorrecta de fecha en Linux/ICU. Redeploy exitoso.
- 2026-05-09: Fix build production: `export const dynamic = "force-dynamic"` en layout.tsx + `pages/_document.tsx` + `pages/404.tsx` + `pages/500.tsx`. Ver DEC-012.
- 2026-05-09: F3 cerrada. F3-04 (32+8 tests), F3-05 (OWASP hardening), F3-06 (estabilidad: 13/13 suites, prod checks 35/35). Build limpio.
- 2026-05-09: F4 activada. Target: 2026-05-28. 6 tareas: env vars prod, deploy Railway, dominio, validación usuario real, monitoreo, go-live. Ver DEC-013.
- 2026-05-09: UI-01 activada — Rediseño ejecutivo mobile-first. Objetivo: convertir el MVP técnico en experiencia premium móvil sin tocar backend ni lógica funcional. Ver DEC-015.
- 2026-05-09: Regla UX de agenda aprobada — toda actividad visible debe mostrar día y hora; si una tarea no tiene hora en schema, mostrar explícitamente `sin hora`.
- 2026-05-09: Prioridad manual pasa a señal secundaria. La app calcula foco operativo automáticamente según señales temporales, carga, conflictos, recordatorios y vencidos. Ver DEC-016.
- 2026-05-09: Producción actualizada con el rediseño ejecutivo mobile-first (`938b214`, Railway deploy `fa88bc4a`). Verificación por bundle/HTTP OK: `ExecutiveBrief`, `Foco de hoy` y QuickAdd premium presentes; textos antiguos `TOP 5 PRIORIDADES` y `AÑADIR RÁPIDO` ausentes. Validación real móvil no ejecutada en esta sesión. Ver DEC-017.
- Ver `decisions_log.md` — DEC-001 a DEC-017

### Next Actions
- [x] [F2-01] CRUD API de Tareas ✓
- [x] [F2-02] CRUD API de Eventos ✓
- [x] [F2-03] CRUD API de Recordatorios ✓
- [x] [F2-04] Dashboard UI ✓
- [x] [F2-05] Formularios quick-add ✓
- [x] [F2-06] Vista prioridades + resumen diario ✓
- [x] [BUILD FIX] npm run build exit 0 (DEC-012) ✓
- [x] [F3-01] Google OAuth 2.0 + token store ✓
- [x] [F3-02] Sync unidireccional Google Calendar → DB ✓
- [x] [F3-03] Resolver conflictos eventos — dev — 2026-08-08
- [x] [F3-04] Suite tests integración + carga ✓ (32/32 integración + 8/8 carga, p95=204ms)
- [x] [F3-05] Hardening seguridad OWASP ✓ (rate limit, CSP, headers, sanitize, JWT 8h)
- [x] [F3-06] Estabilidad producción Railway ✓ (13/13 suites, 35/35 prod checks, build limpio)
- [ ] [F4-01] Configurar env vars producción Railway — dev — 2026-05-16
- [x] [F4-02] Deploy Railway + smoke test remoto — dev — 2026-05-16
- [ ] [F4-03] Dominio público + HTTPS — dev — 2026-05-20
- [ ] [F4-04] Sesión validación real del ejecutivo — usuario — 2026-05-23
- [ ] [F4-05] Monitoreo básico Railway — dev — 2026-05-23
- [ ] [F4-06] Go-live formal + guía de acceso — dev — 2026-05-28

### Last Sync
- **Fecha**: null
- **Sincronizado por**: null
- **Resultado**: No sincronizado aún — `ClickUp List ID` pendiente de configurar

---

*Última actualización: 2026-05-09 — F3 cerrada formalmente (6/6 tareas completadas). F4 activada: despliegue final + validación real de usuario + lanzamiento MVP. Target: 2026-05-28.*
