# Usage Guide — Cómo usar el Project OS

> Esta guía explica cómo interactuar con el sistema desde cualquier IDE con agente IA (Antigravity, Cursor, VS Code Copilot, Claude Code, etc.).
> No necesitas saber programar para usar este sistema.

---

## Qué es este sistema

Este es tu **Project OS** — un sistema de gestión de proyectos que vive en tu IDE y piensa contigo.

- La **inteligencia** está en `/agent/` — aquí viven los agentes, las reglas y tu memoria de proyectos
- La **conexión con ClickUp** está en `/app/` — es la capa técnica que sincroniza tareas
- Tu **memoria de proyectos** está en `/agent/memory/` — aquí se guarda todo lo que el agente sabe sobre tu trabajo

ClickUp es solo la herramienta de ejecución. El cerebro del sistema eres tú, asistido por el agente.

---

## 1. Cómo iniciar una sesión

Al abrir una conversación nueva con el agente, dile que lea el sistema primero:

> **"Actúa como mi Project OS usando /agent/context/system_overview.md"**

O de forma más directa:

> **"Lee /agent/context/system_overview.md y actúa como mi project manager"**

El agente leerá la configuración del sistema y estará listo para operar con todo el contexto de tus proyectos.

**Recomendación:** Empieza cada sesión con este comando para asegurarte de que el agente tiene el contexto correcto.

---

## 2. Qué archivos lee primero el agente

El agente lee en este orden al iniciar:

| Archivo | Para qué |
|---------|----------|
| `/agent/context/system_overview.md` | Entender qué es el sistema y cómo funciona |
| `/agent/context/operating_principles.md` | Las reglas que gobiernan su comportamiento |
| `/agent/memory/active_projects.md` | Ver en qué proyectos estás trabajando ahora |
| `/agent/memory/user_preferences.md` | Tu estilo de trabajo y preferencias |

No necesitas pedirle que los lea uno por uno. El comando de inicio los activa todos.

---

## 3. Cómo pedir la creación de un proyecto nuevo

Simplemente describe qué quieres lograr. El agente extrae todo lo necesario del texto natural:

> **"Quiero crear un proyecto para lanzar mi app de fitness antes de septiembre"**

> **"Necesito organizar el desarrollo de un SaaS de gestión de inventario para pymes"**

> **"Ayúdame a crear un plan para la reforma integral de mi apartamento. Empezamos en junio"**

> **"Quiero estructurar un proyecto inmobiliario para comprar un piso de inversión"**

El sistema hará como máximo 2 preguntas antes de crear la estructura completa. Generará fases, milestones y tareas iniciales automáticamente.

---

## 4. Cómo pedir revisión de proyectos activos

Para revisar el estado general de tus proyectos:

> **"Revisa mis proyectos activos y dime cómo están"**

> **"¿Qué proyectos tengo activos y cuál va más retrasado?"**

Para ver riesgos específicos:

> **"Revisa mis proyectos activos y dime qué riesgos hay"**

> **"¿Hay algún bloqueo o riesgo alto en mis proyectos?"**

Para un proyecto concreto:

> **"¿Cómo va el proyecto [nombre]? ¿Hay algo que necesite atención?"**

---

## 5. Cómo pedir sincronización con ClickUp

Para sincronizar el estado de un proyecto con ClickUp:

> **"Sincroniza el estado del proyecto [nombre] con ClickUp"**

> **"Actualiza ClickUp con las tareas del proyecto [nombre]"**

Para sincronizar todo:

> **"Sincroniza todos mis proyectos activos con ClickUp"**

**Nota:** Para que la sincronización funcione, necesitas tener configurado `CLICKUP_API_TOKEN` en tu archivo `.env` y el ID de la lista de ClickUp en el registro del proyecto dentro de `/agent/memory/active_projects.md`.

Si no tienes ClickUp configurado, el sistema guardará todo en memoria y podrás sincronizar después.

---

## 6. Cómo pedir el reporte semanal

Al final de la semana o cuando quieras un resumen:

> **"Genera el reporte semanal de mis proyectos"**

> **"Dame un resumen del estado de todos mis proyectos esta semana"**

> **"Haz la revisión semanal"**

El agente revisará el estado de todas las tareas, identificará lo completado, lo pendiente y los bloqueos, y te presentará un resumen ejecutivo.

---

## 7. Otros comandos útiles

**Agregar una tarea a un proyecto:**
> "Agrega al proyecto [nombre] la tarea: [descripción de la tarea]"

**Cambiar el estado de una tarea:**
> "Marca como completada la tarea [nombre] del proyecto [nombre del proyecto]"

**Ver las tareas de la semana:**
> "¿Qué tengo que hacer esta semana?"

**Registrar una decisión:**
> "Registra esta decisión: hemos decidido cambiar el stack técnico a Node.js por [razón]"

**Ver el historial de decisiones:**
> "Muéstrame las decisiones registradas del proyecto [nombre]"

**Crear un acta de reunión:**
> "Acabo de tener una reunión sobre [tema]. Los puntos discutidos fueron: [resumen]. Genera el acta."

**Ver los riesgos de un proyecto:**
> "Muéstrame los riesgos abiertos del proyecto [nombre]"

---

## 8. Ejemplos completos de uso

### Iniciar el día

> "Actúa como mi Project OS. Lee /agent/context/system_overview.md y dime qué tengo pendiente para hoy."

### Crear un proyecto nuevo

> "Quiero crear una startup de IA que automatice la gestión de reuniones para equipos remotos. Necesito tener un MVP listo para diciembre."

### Hacer la revisión semanal

> "Es viernes. Genera el reporte semanal de todos mis proyectos activos. Quiero saber qué se completó, qué está pendiente y si hay riesgos."

### Sincronizar después de trabajar

> "Actualiza ClickUp con el estado actual del proyecto Reforma Apartamento."

### Tomar decisiones

> "Hemos decidido postponer el lanzamiento del SaaS al 15 de octubre por problemas con el proveedor de pagos. Registra esta decisión y actualiza la fecha límite del proyecto."

---

## Dónde vive cada cosa

| Qué necesitas | Dónde está |
|---------------|-----------|
| Estado actual de proyectos | `/agent/memory/active_projects.md` |
| Proyectos terminados | `/agent/memory/completed_projects.md` |
| Decisiones tomadas | `/agent/memory/decisions_log.md` |
| Riesgos detectados | `/agent/memory/risks_log.md` |
| Tus preferencias | `/agent/memory/user_preferences.md` |
| Notas de sesión | `/agent/memory/session_notes.md` |
| Cómo funciona el sistema | `/agent/context/system_overview.md` |
| Reglas del agente | `/agent/context/operating_principles.md` |

---

## Configuración inicial (una sola vez)

Antes de usar el sistema por primera vez:

1. Copia `.env.example` y renómbralo a `.env`
2. Agrega tu token de ClickUp: `CLICKUP_API_TOKEN=pk_...`
3. Agrega tu Team ID de ClickUp: `CLICKUP_TEAM_ID=...`
4. Abre `/agent/memory/user_preferences.md` y completa tus preferencias

Puedes usar el sistema sin ClickUp configurado — todo se guardará en memoria y sincronizarás cuando lo necesites.
