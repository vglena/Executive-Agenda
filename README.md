# Sistema Operativo Cognitivo — Agente IA de Gestión de Proyectos

> Un sistema modular de agente IA para planificación, seguimiento y coordinación de proyectos, con integración operativa a ClickUp.

---

## Visión General

Este sistema actúa como un **sistema operativo cognitivo**: el agente razona, planifica y decide de forma autónoma, mientras que ClickUp sirve como herramienta operativa externa para ejecutar y sincronizar tareas.

**Principio fundamental:** La inteligencia vive en `/agent`. La interfaz y las integraciones viven en `/app`.

---

## Estructura del Proyecto

```
/
├── agent/                    # Núcleo cognitivo del sistema
│   ├── agents/               # Perfiles de subagentes especializados
│   ├── skills/               # Capacidades reutilizables del agente
│   ├── directives/           # SOPs y procesos paso a paso
│   ├── memory/               # Memoria persistente entre sesiones
│   ├── execution/            # Scripts mecánicos de ejecución
│   └── context/              # Reglas globales y visión del sistema
│
├── app/                      # Capa de aplicación y experiencia
│   ├── frontend/             # Interfaz de usuario
│   ├── backend/              # Lógica de servidor
│   ├── api/                  # Endpoints y contratos de API
│   └── integrations/
│       └── clickup/          # Conector operativo con ClickUp
│
├── .env.example              # Variables de entorno requeridas
└── README.md                 # Este archivo
```

---

## Separación de Responsabilidades

| Capa | Contenido | Propósito |
|------|-----------|-----------|
| `/agent/agents` | Perfiles de subagentes | Definen identidad, rol y prioridades de cada agente |
| `/agent/skills` | Capacidades del dominio | Describen cómo operar en cada área (no toman decisiones) |
| `/agent/directives` | SOPs y flujos de trabajo | Procesos paso a paso con inputs, validaciones y outputs |
| `/agent/memory` | Estado persistente | Única fuente de verdad entre sesiones |
| `/agent/execution` | Scripts mecánicos | Acciones repetibles sin lógica de decisión |
| `/agent/context` | Reglas globales | Sistema de creencias y principios de operación |
| `/app` | Interfaz y aplicación | Todo lo visual, técnico y de infraestructura |
| `/app/integrations/clickup` | Conector ClickUp | Comunicación con la API externa |

---

## Subagentes Disponibles

| Agente | Responsabilidad Principal |
|--------|--------------------------|
| `project_manager_agent` | Coordinación global, priorización y seguimiento |
| `planning_agent` | Planificación, hitos y estructura de tareas |
| `risk_agent` | Detección de riesgos, bloqueos y dependencias |
| `reporting_agent` | Informes, resúmenes ejecutivos y seguimiento semanal |
| `operations_agent` | Tareas operativas y sincronización con ClickUp |

---

## Flujo de Trabajo Típico

```
Usuario → project_manager_agent
           ├── planning_agent      → genera estructura de tareas
           ├── risk_agent          → detecta bloqueos y riesgos
           ├── reporting_agent     → produce informes
           └── operations_agent    → sincroniza con ClickUp
                                       └── /app/integrations/clickup → API ClickUp
```

---

## Integración con ClickUp

ClickUp es una **herramienta operativa externa**, no el cerebro del sistema.

- La memoria interna (en `/agent/memory`) es la fuente principal de contexto.
- ClickUp es la fuente operativa de tareas y estados.
- La autenticación usa **Personal API Token** vía variables de entorno.
- Las credenciales **nunca** se guardan en archivos Markdown.

Ver: [`app/integrations/clickup/README.md`](app/integrations/clickup/README.md)

---

## Compatibilidad

Este sistema está diseñado para funcionar con:

- **IDEs**: Cursor, VS Code, Windsurf, Claude Code, Antigravity
- **Modelos IA**: GPT-4, Claude, Gemini, Llama, cualquier modelo compatible
- **Formato**: Markdown como protocolo universal de configuración y contexto

---

## Inicio Rápido

1. Copia `.env.example` a `.env` y completa tus credenciales.
2. Lee [`agent/context/system_overview.md`](agent/context/system_overview.md) para entender el sistema.
3. Revisa [`agent/context/operating_principles.md`](agent/context/operating_principles.md) para las reglas de operación.
4. Activa el agente principal: [`agent/agents/project_manager_agent.md`](agent/agents/project_manager_agent.md).
5. Sigue la directiva [`agent/directives/project_intake.md`](agent/directives/project_intake.md) para crear tu primer proyecto.

---

## Estado del Sistema

- **Versión**: 0.1.0
- **Fase**: Base estructural
- **Fecha**: Mayo 2026
