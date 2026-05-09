# Directive: New Project Creation

## Objetivo

Guiar al sistema a través del proceso completo de creación de un proyecto nuevo — desde la petición inicial del usuario hasta el registro en memoria y la sincronización opcional con ClickUp — garantizando que la información sea suficiente, la estructura sea coherente, y el contexto quede correctamente documentado antes de ejecutar cualquier acción.

---

## Cuándo se Activa

Esta directive se activa cuando:

- El usuario expresa intención de crear un proyecto nuevo ("quiero empezar un proyecto", "tengo una idea nueva", "necesito gestionar X")
- El `project_manager_agent` detecta un objetivo que no corresponde a ningún proyecto existente en `memory/active_projects.md`
- Se inicia una sesión con un objetivo nuevo sin contexto previo en memoria

**No se activa si:**
- El proyecto ya existe en memoria (usar `directives/clickup_sync.md` o `directives/weekly_review.md`)
- El usuario solo quiere agregar tareas a un proyecto activo

---

## Agente Responsable

`project_manager_agent` — coordina el proceso completo  
`planning_agent` — genera la estructura de fases y tareas  
`operations_agent` — ejecuta la sincronización con ClickUp (solo si aplica)

---

## Inputs Mínimos Necesarios

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Nombre del proyecto | Identificador único, claro y corto | Sí |
| Objetivo principal | Qué debe lograrse al finalizar el proyecto | Sí |
| Fecha límite o duración estimada | Cuándo debe estar listo | Sí |
| Contexto breve | Por qué existe este proyecto, qué problema resuelve | Recomendado |
| Restricciones conocidas | Límites de tiempo, personas, recursos, dependencias | Recomendado |
| Lista de ClickUp | ID de la lista donde vivirán las tareas | Opcional |

> **Regla:** No bloquear el proceso si faltan campos opcionales o recomendados. Registrar como `null` o `por confirmar` y continuar.

---

## Preguntas a Hacer si Falta Información

Solo preguntar lo estrictamente necesario. Nunca más de 3 preguntas en un mismo turno.

**Si falta el objetivo:**
> "¿Qué debe existir o estar listo cuando este proyecto termine?"

**Si falta la fecha límite:**
> "¿Tienes una fecha objetivo o una duración estimada? (ej. 'fin de junio' o '6 semanas')"

**Si el objetivo es demasiado amplio:**
> "¿Esto es un solo proyecto o puede dividirse en partes independientes?"

**Si no hay contexto:**
> No preguntar — inferir del objetivo y continuar. El contexto se puede enriquecer después.

**Si no hay lista de ClickUp:**
> No preguntar. Registrar `clickup_list_id: null` y continuar. El usuario puede sincronizar luego.

---

## Proceso Paso a Paso

### Paso 1 — Recopilar información mínima

- Verificar si el usuario ya proporcionó nombre, objetivo y fecha en su petición
- Si falta alguno de los tres, preguntar de forma directa y concisa (máximo una pregunta por vez)
- Una vez obtenidos los tres campos obligatorios, continuar sin esperar más datos

### Paso 2 — Verificar que no existe un proyecto duplicado

- Leer `memory/active_projects.md`
- Si ya existe un proyecto con el mismo nombre o un objetivo idéntico:
  - Notificar al usuario
  - Preguntar si quiere actualizar el existente o crear uno nuevo con nombre diferente
  - No crear duplicados

### Paso 3 — Generar la estructura del proyecto

Delegar al `planning_agent`. El planning_agent debe:

1. Dividir el proyecto en **fases lógicas** (ver sección "Cómo generar fases")
2. Generar **tareas iniciales** por fase (ver sección "Cómo generar tareas")
3. Identificar el **hito principal** de cada fase
4. Estimar **fechas de cierre** por fase basándose en la fecha límite del proyecto

### Paso 4 — Decidir qué tareas van a ClickUp

(Ver sección dedicada más abajo)

### Paso 5 — Registrar el proyecto en memoria

- Guardar en `memory/active_projects.md` con formato estándar (ver sección de outputs)
- Asignar ID incremental: `PRJ-XXX` (revisar el último ID en el archivo)

### Paso 6 — Registrar la decisión de creación

- Guardar en `memory/decisions_log.md` la decisión de iniciar este proyecto
- Incluir: fecha, nombre del proyecto, objetivo, fecha límite, razonamiento si el usuario lo proporcionó

### Paso 7 — Sincronizar con ClickUp (condicional)

- **Solo si** el usuario tiene `clickup_list_id` disponible
- Activar `directives/clickup_task_creation.md` para cada tarea marcada como `→ ClickUp`
- Guardar los IDs de ClickUp devueltos en `memory/active_projects.md`
- Si no hay lista de ClickUp: finalizar sin sincronización y confirmar al usuario

### Paso 8 — Confirmar al usuario

Presentar un resumen de lo creado:
- Nombre del proyecto y objetivo
- Número de fases y tareas generadas
- Fecha límite registrada
- Si se sincronizó con ClickUp o no (y por qué)

---

## Cómo Generar Fases del Proyecto

El `planning_agent` debe aplicar estas reglas:

- **Máximo 5 fases** para proyectos medianos (3-6 meses)
- **Mínimo 2 fases** para cualquier proyecto (siempre hay un inicio y un cierre)
- Cada fase representa un **bloque de trabajo cohesivo** con un entregable claro
- Las fases deben ser **secuenciales** salvo que el planning_agent identifique trabajo paralelo explícito

**Estructura estándar de fases (adaptar según el proyecto):**

| Fase | Nombre genérico | Propósito |
|------|----------------|-----------|
| 1 | Definición | Clarificar alcance, reunir recursos, validar supuestos |
| 2 | Ejecución | Trabajo central del proyecto |
| 3 | Revisión | Control de calidad, correcciones, validación |
| 4 | Cierre | Entrega, documentación final, retrospectiva |

> Para proyectos técnicos, de marketing, o con etapas específicas, el `planning_agent` puede ajustar los nombres y dividir la fase de ejecución en sub-fases.

**Calcular fechas de fase:**
- Fecha inicio fase 1 = fecha de hoy
- Fecha límite fase final = fecha límite del proyecto
- Distribuir proporcionalmente: fases intermedias reciben tiempo según su complejidad estimada
- Usar formato `YYYY-MM-DD` siempre

---

## Cómo Generar Tareas Iniciales

El `planning_agent` debe generar **3 a 6 tareas por fase** siguiendo estas reglas:

1. Cada tarea debe ser **accionable** — empieza con un verbo (Crear, Definir, Revisar, Implementar, Validar...)
2. Cada tarea debe ser **completable en 1 a 5 días** — si es más grande, dividirla
3. Cada tarea debe tener:
   - Nombre claro
   - Descripción de una línea (qué hay que hacer y qué se obtiene)
   - Prioridad: `P1` (urgente+importante), `P2` (importante), `P3` (necesaria), `P4` (opcional)
   - Fecha estimada de inicio o entrega

4. Identificar la **primera tarea a ejecutar** (la que desbloquea el resto) y marcarla como la tarea de arranque

**Ejemplo de tarea bien formada:**
```
- Nombre: Definir criterios de éxito del proyecto
- Descripción: Redactar 3-5 métricas concretas que indicarán que el proyecto fue exitoso
- Prioridad: P1
- Fecha estimada: YYYY-MM-DD
```

---

## Cómo Decidir qué Tareas van a ClickUp

No todas las tareas deben ir a ClickUp. Usar estos criterios:

| Criterio | ¿Va a ClickUp? |
|----------|---------------|
| Tarea tiene fecha concreta y responsable | Sí |
| Tarea es la primera en ejecutarse | Sí |
| Tarea es un hito o entregable visible | Sí |
| Tarea es interna de planificación (solo el agente la usa) | No |
| Tarea tiene prioridad P4 y sin fecha | No |
| No hay lista de ClickUp configurada | No (ninguna) |

**Regla general:** En la creación inicial, enviar a ClickUp solo las tareas de la **primera fase activa**. Las tareas de fases futuras se crean en ClickUp cuando esa fase se active, para mantener ClickUp limpio y relevante.

Marcar en el registro de memoria:
- `→ ClickUp` para tareas que deben sincronizarse
- `→ memoria` para tareas que viven solo en el registro interno

---

## Cómo Guardar el Proyecto en memoria/active_projects.md

Agregar al final del archivo con este formato:

```markdown
## [Nombre del Proyecto]
- **ID**: PRJ-XXX
- **Estado**: activo
- **Objetivo**: [descripción concreta del resultado esperado]
- **Fecha inicio**: YYYY-MM-DD
- **Fecha límite**: YYYY-MM-DD
- **Contexto**: [una o dos líneas de por qué existe]
- **Restricciones**: [lista o null]
- **ClickUp list ID**: [ID o null]

### Fases
- **Fase 1 — [Nombre]**: [fecha inicio] → [fecha fin]
- **Fase 2 — [Nombre]**: [fecha inicio] → [fecha fin]
- ...

### Hitos
- [ ] [Nombre del hito] — [fecha] — [fase]

### Tareas activas
| Tarea | Fase | Prioridad | Fecha est. | Estado | ClickUp ID |
|-------|------|-----------|------------|--------|------------|
| [nombre] | F1 | P1 | YYYY-MM-DD | pendiente | [ID o null] |
```

---

## Cómo Registrar en memoria/decisions_log.md

Agregar una entrada con este formato:

```markdown
### [DEC-XXX] — Creación del proyecto [Nombre]
- **Fecha**: YYYY-MM-DD
- **Proyecto**: [nombre]
- **Decisión**: Iniciar proyecto con el objetivo: [objetivo]
- **Contexto**: [por qué se crea ahora, qué motivó la petición]
- **Alternativas consideradas**: [otras opciones evaluadas o null]
- **Impacto esperado**: [resultado esperado al completar el proyecto]
- **Estado**: activo
```

---

## Cómo Activar clickup_task_creation.md

Para cada tarea marcada como `→ ClickUp`, el `operations_agent` debe ejecutar `directives/clickup_task_creation.md` con estos inputs:

| Input | Valor |
|-------|-------|
| `list_id` | `clickup_list_id` del proyecto en memoria |
| `task_name` | Nombre de la tarea |
| `description` | Descripción de una línea |
| `priority` | Convertir: P1→urgente, P2→alta, P3→normal, P4→baja |
| `due_date` | Fecha estimada en timestamp ms (multiplicar YYYY-MM-DD × 86400000) |
| `status` | `"pendiente"` (estado inicial por defecto) |

Después de cada creación exitosa: guardar el `task_id` devuelto por ClickUp en la columna `ClickUp ID` de `memory/active_projects.md`.

Si una tarea falla al crearse en ClickUp: registrar el error, continuar con las demás tareas, y reportar al final qué tareas no se sincronizaron.

---

## Validaciones

- [ ] El nombre del proyecto es único en `memory/active_projects.md`
- [ ] El objetivo es específico (no genérico como "mejorar el producto")
- [ ] La fecha límite es una fecha concreta o tiene justificación si es `TBD`
- [ ] Hay al menos 2 fases definidas
- [ ] Hay al menos una tarea con fecha en la primera semana
- [ ] El proyecto fue registrado en `memory/active_projects.md`
- [ ] La decisión fue registrada en `memory/decisions_log.md`
- [ ] Si hay `clickup_list_id`: al menos una tarea fue enviada a ClickUp

---

## Edge Cases

**El usuario da muy poca información:**
→ Preguntar solo por nombre y objetivo. Inferir el resto o marcarlo como `TBD`. No bloquear la creación.

**La fecha límite es demasiado corta para el scope:**
→ Notificar al usuario con una estimación realista. Registrar la fecha que el usuario indique de todas formas. Añadir una nota de riesgo en el campo de restricciones.

**El proyecto es muy grande (scope enorme):**
→ Proponer al usuario dividirlo en sub-proyectos independientes. Si acepta, crear cada uno como un proyecto separado en memoria. Si no acepta, crear uno solo con más de 5 fases y documentar la decisión.

**No hay lista de ClickUp:**
→ Completar el proceso sin sincronización. Registrar `clickup_list_id: null`. Al final, informar al usuario que puede agregar el ID de lista cuando lo tenga para sincronizar después.

**El usuario quiere solo planificar, sin ClickUp:**
→ Respetar la intención. No preguntar por ClickUp. Registrar `clickup_list_id: null` y finalizar después del paso 6.

---

## Outputs Esperados

| Output | Dónde | Condición |
|--------|-------|-----------|
| Proyecto estructurado con fases y tareas | `memory/active_projects.md` | Siempre |
| Decisión de creación documentada | `memory/decisions_log.md` | Siempre |
| Tareas de fase 1 creadas en ClickUp | ClickUp API | Solo si `clickup_list_id` disponible |
| IDs de ClickUp guardados en memoria | `memory/active_projects.md` | Solo si se sincronizó |
| Confirmación al usuario con resumen | Respuesta del agente | Siempre |
