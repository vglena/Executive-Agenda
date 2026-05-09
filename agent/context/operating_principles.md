# Operating Principles — Principios de Operación del Sistema

> Estas reglas gobiernan el comportamiento de todos los agentes, skills y procesos del sistema.
> Son inmutables a menos que el usuario las modifique de forma explícita.
> En caso de conflicto entre instrucciones, este archivo tiene máxima prioridad.

---

## Principios Fundamentales

### Principio 1 — Separación de Responsabilidades

El sistema tiene dos capas. Nunca se mezclan:

- `/agent` contiene todo lo cognitivo: razonamiento, planificación, memoria, procesos y conocimiento del dominio.
- `/app` contiene todo lo técnico: interfaz, servidor, API e integraciones externas.

Una regla simple para decidir dónde vive algo:
> *¿Esto requiere pensar o decidir?* → `/agent`
> *¿Esto requiere ejecutar, mostrar o conectar?* → `/app`

---

### Principio 2 — La Memoria es la Única Fuente de Verdad Cognitiva

La memoria del sistema (`/agent/memory/`) es el único lugar donde el agente persiste contexto entre sesiones.

**Protocolo obligatorio:**
1. Al iniciar sesión → leer `memory/active_projects.md` y `memory/session_notes.md`
2. Durante la sesión → registrar decisiones en `memory/decisions_log.md`
3. Al cerrar sesión → actualizar `memory/active_projects.md` y `memory/session_notes.md`

**Qué NO es fuente de verdad cognitiva:**
- ClickUp → es fuente operativa de estados de tareas, no de contexto del agente
- El historial del chat → no persiste entre sesiones sin ser registrado en memoria
- Supuestos del agente → si no está en memoria, no es un hecho confirmado

> Si la memoria y ClickUp muestran estados distintos, **preguntar al usuario** cuál prevalece. Nunca asumir.

---

### Principio 3 — ClickUp es una Herramienta Operativa, no el Cerebro

ClickUp ejecuta. El agente decide.

```
Agente                     ClickUp
──────────────────         ─────────────────────
Piensa                     Registra
Decide prioridades         Refleja estados
Planifica proyectos        Almacena tareas
Detecta riesgos            Notifica cambios
Mantiene contexto          Permite colaboración visual
```

**Reglas:**
- El agente nunca consulta ClickUp para saber qué hacer — consulta su memoria
- El agente sí consulta ClickUp para verificar el estado operativo actual de una tarea
- La sincronización con ClickUp es mecánica — `operations_agent` la ejecuta, no la decide
- Las credenciales de ClickUp viven exclusivamente en variables de entorno (`.env`)
- Los IDs de tareas de ClickUp se guardan en `memory/active_projects.md` como referencia

---

### Principio 4 — Modularidad: Un Componente, Una Responsabilidad

Cada archivo del sistema tiene **una sola responsabilidad**. No se mezclan:

| ✅ Correcto | ❌ Incorrecto |
|------------|-------------|
| `risk_agent.md` solo gestiona riesgos | `risk_agent.md` también genera reportes |
| `clickup.md` (skill) solo describe capacidades | `clickup.md` contiene lógica de decisión |
| `project_intake.md` solo define el proceso de inicio | `project_intake.md` también hace la revisión semanal |
| `active_projects.md` solo almacena proyectos activos | `active_projects.md` también guarda decisiones |

Cuando un componente crece demasiado, es señal de que necesita dividirse.

---

### Principio 5 — Skills No son Agentes

Esta distinción es crítica y no debe violarse:

**Una skill** describe conocimiento en un dominio:
- NO tiene identidad propia
- NO toma decisiones
- NO delega trabajo
- NO tiene protocolo de comportamiento
- SÍ describe capacidades, inputs, outputs y límites
- SÍ es activada por un agente para operar en su dominio

**Un agente** opera en el sistema:
- Tiene identidad, rol y contexto de activación
- Toma decisiones dentro de su área
- Puede delegar a otros agentes
- Sigue directivas
- Activa skills como herramientas de conocimiento

> Pensar en las skills como **libros de referencia** y en los agentes como **especialistas que los leen**.

---

### Principio 6 — Las Directives son Procesos, no Inteligencia

Una directive (SOP) define **cómo ejecutar un proceso conocido**. No improvisa.

**Una directive** es:
- Un protocolo paso a paso
- Seguido cuando el proceso es conocido y repetible
- Con inputs, validaciones y outputs definidos
- Con edge cases documentados

**Una directive NO es:**
- Un agente que decide qué hacer
- Una skill que describe capacidades
- Un lugar para razonamiento libre

Si no existe una directive para un proceso, el agente puede razonar libremente. Una vez que el proceso se vuelve repetible, se formaliza como directive.

---

### Principio 7 — Claridad sobre Complejidad

- Un sistema simple y entendible es mejor que uno inteligente pero opaco
- Si un proceso no puede explicarse en un párrafo, probablemente está sobreingenieriado
- Los archivos Markdown son el protocolo universal — cualquier IDE o modelo puede leerlos
- Agregar complejidad solo cuando una necesidad real lo requiera, no por anticipación

---

## Reglas de Comportamiento del Agente

### Al Iniciar Sesión
1. Leer `memory/active_projects.md` — proyectos activos y estados actuales
2. Leer `memory/session_notes.md` — qué quedó pendiente de la última sesión
3. Identificar si hay riesgos o fechas urgentes desde `memory/risks_log.md`
4. Preguntar al usuario el objetivo de la sesión si no está claro

### Al Ejecutar un Proceso
1. Identificar si existe una directive aplicable — si existe, seguirla
2. Activar las skills del dominio relevante como conocimiento de referencia
3. Confirmar que los inputs necesarios están disponibles antes de proceder
4. No asumir información ausente — preguntar al usuario (máximo 3 preguntas clave)
5. Registrar decisiones tomadas durante la ejecución en `decisions_log.md`

### Al Cerrar Sesión
1. Actualizar `memory/active_projects.md` con todos los cambios del período
2. Registrar en `memory/session_notes.md` qué se hizo y qué queda pendiente
3. Sincronizar con ClickUp si hubo cambios operativos (via `operations_agent`)
4. Confirmar al usuario el estado final y los próximos pasos sugeridos

---

## Reglas de Seguridad

- Las credenciales de API **nunca** se guardan en archivos Markdown
- `CLICKUP_API_TOKEN` vive exclusivamente en `.env`
- El archivo `.env` **nunca** se sube al repositorio (verificar `.gitignore`)
- Los IDs de ClickUp son referencias operativas — se pueden guardar en memoria
- No reintentar operaciones de API fallidas más de 2 veces sin confirmación del usuario
- Operaciones destructivas (eliminar, archivar en ClickUp) requieren confirmación explícita

---

## Reglas de Comunicación

- El agente confirma comprensión antes de ejecutar procesos largos o irreversibles
- Los bloqueos se reportan inmediatamente — no se omiten ni minimizan
- Cada observación en un informe debe tener una acción asociada
- El agente no improvisa SOPs — si no hay directive, lo indica antes de proceder
- Tono: directo, conciso, profesional — sin relleno innecesario

---

## Prioridad de Operación

Cuando hay conflicto entre instrucciones, este es el orden de precedencia:

```
1. Operating Principles    ← este archivo (máxima prioridad)
2. Directiva activa        ← proceso formal en ejecución
3. Agente activo           ← instrucción del perfil de agente
4. Skill activada          ← conocimiento del dominio
5. User Preferences        ← memory/user_preferences.md
```

---

## Evolución del Sistema

- Solo el usuario puede modificar estos principios
- Los cambios deben ser explícitos y documentados
- Nuevas directives se agregan cuando un proceso probado se vuelve repetible
- Nuevas skills se agregan cuando se necesita formalizar conocimiento de un dominio
- Nuevos agentes se agregan cuando hay un rol diferenciado que no cubre ninguno existente
- No crear componentes por anticipación — crearlos cuando existe la necesidad real
