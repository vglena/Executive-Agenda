# System Overview — Agente IA de Gestión de Proyectos

## Propósito del Sistema

Este sistema es un **sistema operativo cognitivo** para gestión de proyectos.

Permite a un agente IA planificar, coordinar, monitorear y reportar sobre proyectos de manera autónoma, con integración operativa a ClickUp. Está diseñado para funcionar como el cerebro persistente de un gestor de proyectos: recuerda el contexto entre sesiones, sigue procesos estructurados, delega trabajo a subagentes especializados y sincroniza el estado operativo con herramientas externas.

El sistema no depende de ningún IDE, modelo de IA ni interfaz específica. Funciona con Cursor, VS Code, Windsurf, Claude Code u otros entornos compatibles con Markdown.

---

## Separación Fundamental: Agente vs. Aplicación

El principio más importante del sistema es la **separación total entre la capa cognitiva y la capa de aplicación**.

```
/agent    ← todo lo que piensa, decide y recuerda
/app      ← todo lo que se muestra, ejecuta técnicamente o conecta con el exterior
```

### `/agent` — La Capa Cognitiva

Contiene la inteligencia del sistema. Todo lo que es razonamiento, planificación, memoria o proceso vive aquí:

| Carpeta | Contenido | Responsabilidad |
|---------|-----------|----------------|
| `agents/` | Perfiles de subagentes | Quién es cada agente, qué rol tiene, cuándo activarse |
| `skills/` | Capacidades del dominio | Qué sabe hacer el agente en cada área |
| `directives/` | SOPs y procesos | Cómo debe proceder el agente paso a paso |
| `memory/` | Estado persistente | Qué recuerda el sistema entre sesiones |
| `execution/` | Scripts mecánicos | Qué ejecuta de forma repetible sin decisión |
| `context/` | Reglas globales | Bajo qué principios opera el sistema completo |

### `/app` — La Capa de Aplicación

Contiene la infraestructura técnica. Nada aquí toma decisiones de gestión:

| Carpeta | Contenido |
|---------|-----------|
| `frontend/` | Interfaz de usuario |
| `backend/` | Servidor y lógica de aplicación |
| `api/` | Endpoints y contratos |
| `integrations/clickup/` | Conector técnico con la API de ClickUp |

**Regla crítica**: Nunca mezclar lógica cognitiva en `/app`, ni lógica técnica de aplicación en `/agent`.

---

## Anatomía del Sistema: Qué es Cada Componente

### Los Agentes (`/agents`) — quiénes son

Un agente es un **perfil con identidad, rol y comportamiento específico**. Define:
- Qué responsabilidades tiene
- Qué skills activa
- Qué directivas sigue
- Cuándo delega a otro agente
- Cómo se comunica

El agente principal es `project_manager_agent`. Los demás son subagentes especializados: `planning_agent`, `risk_agent`, `reporting_agent`, `operations_agent`.

> Los agentes **toman decisiones**. Tienen criterio y razonamiento.

---

### Las Skills (`/skills`) — qué saben hacer

Una skill es una **descripción de capacidad en un dominio**. No es un agente. No toma decisiones. Describe:
- Qué puede hacerse en ese dominio
- Qué inputs se necesitan
- Qué outputs se producen
- Qué herramientas son compatibles
- Cuáles son los límites

Las skills son **usadas por los agentes**, no al revés. Un agente activa una skill para operar en su dominio.

> Las skills **no deciden**. Son conocimiento declarativo.

**Diferencia con un agente:**

| Agente | Skill |
|--------|-------|
| Tiene identidad propia | No tiene identidad |
| Toma decisiones | Describe capacidades |
| Puede delegar | No delega |
| Tiene protocolo de comportamiento | Tiene definición de dominio |
| Ejemplo: `risk_agent` | Ejemplo: `risk_management` |

---

### Las Directives (`/directives`) — cómo proceder

Una directive es un **SOP (Standard Operating Procedure)**. Define un proceso completo con:
- Objetivo claro
- Inputs requeridos
- Pasos ordenados
- Validaciones
- Edge cases
- Outputs esperados

Las directives son seguidas por los agentes cuando enfrentan un proceso conocido. No improvisan el proceso — siguen la directiva.

> Las directives **definen el cómo**. Son procesos, no inteligencia.

**Diferencia con una skill:**

| Directive | Skill |
|-----------|-------|
| Define pasos secuenciales | Define capacidades del dominio |
| Tiene inputs/outputs concretos | Tiene descripción general |
| Se sigue como un protocolo | Se activa como conocimiento |
| Ejemplo: `project_intake.md` | Ejemplo: `project_management.md` |

---

### La Memoria (`/memory`) — la fuente de verdad

La memoria es el **único lugar donde el sistema persiste contexto entre sesiones**.

Cada archivo de memoria tiene un propósito específico:

| Archivo | Qué guarda |
|---------|------------|
| `active_projects.md` | Estado completo de proyectos en curso |
| `completed_projects.md` | Historial de proyectos cerrados |
| `decisions_log.md` | Todas las decisiones tomadas y su contexto |
| `risks_log.md` | Riesgos detectados, su estado y planes de mitigación |
| `feedback_log.md` | Aprendizajes y feedback del usuario |
| `session_notes.md` | Continuidad entre sesiones de trabajo |
| `user_preferences.md` | Preferencias y configuración personal |

**Regla de oro**: Antes de actuar, leer memoria. Después de actuar, actualizar memoria.

> La memoria **no es ClickUp**. ClickUp es la fuente operativa de tareas y estados actuales. La memoria es la fuente cognitiva de contexto, decisiones y razonamiento.

---

### Los Scripts de Ejecución (`/execution`) — lo mecánico

Los scripts de ejecución son **operaciones repetibles sin lógica de decisión**. Reciben inputs definidos, ejecutan una acción, retornan un resultado.

No razonan. No se adaptan. No escriben en memoria. Solo ejecutan.

> Los scripts son **manos, no cerebro**.

---

## El Rol de ClickUp en el Sistema

ClickUp es una **herramienta operativa externa**. No es el cerebro del sistema.

```
  CEREBRO DEL SISTEMA          HERRAMIENTA OPERATIVA
  ─────────────────────        ─────────────────────
  /agent/memory/          →    ClickUp
  (contexto cognitivo)         (tareas y estados visibles)
```

| ClickUp SÍ hace | ClickUp NO hace |
|----------------|----------------|
| Almacena tareas con estados visibles | Almacena razonamiento o contexto del agente |
| Registra fechas y asignados | Toma decisiones de prioridad o planificación |
| Notifica cambios del equipo | Contiene la lógica del sistema |
| Refleja el estado operativo actual | Reemplaza la memoria interna |
| Permite colaboración con otras personas | Define qué hacer ni cómo hacerlo |

El agente **decide** qué crear en ClickUp. `operations_agent` **ejecuta** esa decisión. ClickUp **registra** el resultado.

La autenticación con ClickUp usa **Personal API Token** configurado como variable de entorno (`CLICKUP_API_TOKEN`). Las credenciales nunca se almacenan en archivos Markdown.

---

## Flujo de una Sesión Típica

```
Usuario hace una solicitud
         │
         ▼
project_manager_agent
  1. Lee memory/active_projects.md       ← contexto actual
  2. Lee memory/session_notes.md         ← continuidad
  3. Identifica la directive aplicable
  4. Activa skills relevantes
  5. Delega a subagente si corresponde
         │
         ├── planning_agent   → estructura tareas
         ├── risk_agent       → evalúa riesgos
         ├── reporting_agent  → genera informes
         └── operations_agent → sincroniza con ClickUp
                                      │
                                      ▼
                             app/integrations/clickup
                                      │
                                      ▼
                               API ClickUp (v2)
         │
         ▼
  6. Actualiza memory/ con cambios
  7. Registra session_notes.md
  8. Confirma resultado al usuario
```

---

## Compatibilidad

- **IDEs**: Cursor, VS Code, Windsurf, Claude Code, Antigravity y similares
- **Modelos IA**: GPT-4, Claude, Gemini, Llama, cualquier modelo compatible con Markdown
- **Formato de control**: Markdown como protocolo universal
- **Integración externa**: ClickUp API v2 via Personal API Token

---

## Identidad del Sistema

- **Nombre**: Agente IA de Gestión de Proyectos
- **Tipo**: Sistema operativo cognitivo modular
- **Formato principal**: Markdown
- **Versión**: 0.1.0
- **Fecha base**: Mayo 2026
