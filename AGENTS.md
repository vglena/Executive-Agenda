# AGENTS.md — Project OS

## Qué es este sistema

Este repositorio es un **Project OS personal** — un sistema de gestión de proyectos cognitivo que vive en el IDE y opera con agentes IA.

La inteligencia está en `/agent/`. La ejecución técnica está en `/app/`. ClickUp es la capa operativa, no el cerebro.

---

## Contexto obligatorio al iniciar

Lee estos archivos antes de operar:

1. `/agent/context/system_overview.md` — arquitectura y filosofía
2. `/agent/context/operating_principles.md` — reglas del sistema
3. `/agent/memory/active_projects.md` — proyectos activos del usuario
4. `/agent/memory/user_preferences.md` — preferencias de trabajo

---

## Estructura del sistema

| Carpeta | Qué contiene |
|---------|-------------|
| `/agent/agents/` | Perfiles de agentes especializados (PM, planning, risk, reporting, operations) |
| `/agent/skills/` | Capacidades reutilizables (project_management, clickup, reporting, calendar…) |
| `/agent/directives/` | SOPs paso a paso para cada proceso operativo |
| `/agent/memory/` | Fuente de verdad — proyectos, decisiones, riesgos, preferencias |
| `/agent/execution/` | Scripts mecánicos de ejecución |
| `/app/integrations/clickup/` | Cliente HTTP TypeScript para la API de ClickUp |
| `/app/services/` | Servicios de orquestación técnica |

---

## Reglas globales

- **La memoria es la fuente de verdad** — `/agent/memory/` siempre tiene prioridad sobre ClickUp
- **ClickUp es operativo** — solo recibe tareas que el agente ya decidió crear; no dirige el sistema
- **Solo Fase 1 va a ClickUp** al crear un proyecto — las fases futuras se mueven a ClickUp cuando se activan
- **Máximo 2 preguntas** al usuario antes de actuar
- **No sobreplanificar** — estructura mínima viable, máximo 6 tareas por fase en el roadmap inicial
- **No tomar decisiones por iniciativa** — confirmar antes de crear, modificar o eliminar
- **Separar cognición y ejecución** — los agentes razonan, los scripts ejecutan

---

## Flujo principal

```
Usuario expresa intención
        │
        ▼
project_request_interpreter.md   → extrae nombre, objetivo, deadline
        │
        ▼
roadmap_generation.md            → genera fases, milestones, tareas, riesgos
        │
        ▼
new_project_creation.md          → valida, asigna PRJ-XXX, prepara payload
        │
        ▼
project_bootstrap.service.ts     → crea tareas F1 en ClickUp + registra en memoria
        │
        ├──→ /agent/memory/active_projects.md
        ├──→ /agent/memory/decisions_log.md
        ├──→ /agent/memory/risks_log.md
        └──→ ClickUp API (solo Fase 1)
```

---

## Comportamiento ante comandos del usuario

**"Quiero crear un proyecto para..."**
→ Activar `directives/project_request_interpreter.md`
→ Extraer datos, hacer máx. 2 preguntas, confirmar en 1 frase
→ Seguir `directives/project_bootstrap_flow.md`

**"Revisa mis proyectos activos" / "¿Qué riesgos hay?"**
→ Leer `memory/active_projects.md` y `memory/risks_log.md`
→ Activar `risk_agent` si hay riesgos detectables
→ Responder con resumen claro: estado, bloqueos, próximas acciones

**"Genera un reporte semanal"**
→ Activar `reporting_agent`
→ Seguir `directives/weekly_review.md`
→ Producir resumen ejecutivo con estado por proyecto

**"Sincroniza ClickUp" / "Actualiza ClickUp"**
→ Activar `operations_agent`
→ Seguir `directives/clickup_sync.md`
→ Reportar qué se sincronizó y qué no

---

## Agentes disponibles

| Agente | Rol |
|--------|-----|
| `project_manager_agent` | Orquestador principal — punto de entrada de toda interacción |
| `planning_agent` | Genera roadmaps, fases, tareas y estimaciones |
| `risk_agent` | Detecta riesgos, bloqueos y dependencias críticas |
| `reporting_agent` | Genera reportes, resúmenes y actas |
| `operations_agent` | Único agente que interactúa con ClickUp |

---

## Archivos de referencia

- Guía de uso: `/agent/context/usage_guide.md`
- Prompt de inicio: `/agent/context/startup_prompt.md`
- Flujo completo de creación: `/agent/directives/project_bootstrap_flow.md`
