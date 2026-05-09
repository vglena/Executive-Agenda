# Script: Project Creator

> Script mecánico para convertir una idea de proyecto ya decidida en una estructura operativa registrada en memoria y opcionalmente sincronizada con ClickUp.
> No toma decisiones. Solo ejecuta lo que el agente ya determinó.

---

## Activado por

`operations_agent` siguiendo `directives/new_project_creation.md`

---

## Relación con otros archivos

| Archivo | Relación |
|---------|----------|
| `directives/new_project_creation.md` | La directive que decide qué crear — este script ejecuta esa decisión |
| `execution/clickup_create_task.md` | Se invoca por cada tarea marcada como `→ ClickUp` en el paso 6 |
| `directives/clickup_sync.md` | Se usa después si se necesita reconciliar el estado |
| `memory/active_projects.md` | Destino principal de escritura — registra el proyecto completo |
| `memory/decisions_log.md` | Destino secundario — registra la decisión de creación |

---

## Inputs Requeridos

Todos los inputs deben venir del agente que activa este script. No se infieren ni se inventan.

```
project_name         → string, no vacío, único en active_projects.md
project_description  → string, resumen de 1-2 líneas del proyecto
objective            → string, resultado concreto y medible al finalizar
priority             → P1 | P2 | P3 | P4
start_date           → YYYY-MM-DD (fecha de hoy por defecto si no se especifica)
target_date          → YYYY-MM-DD o "TBD"
milestones           → array de objetos: [{ name, date, phase }]
tasks                → array de objetos: [{ name, description, phase, priority, due_date, send_to_clickup }]
```

### Inputs opcionales de ClickUp

```
clickup_space_id     → string o null
clickup_folder_id    → string o null
clickup_list_id      → string o null (requerido si alguna tarea tiene send_to_clickup: true)
```

---

## Validaciones de Entrada

Ejecutar antes de cualquier operación. Detener y reportar si alguna falla.

| Validación | Regla | Acción si falla |
|-----------|-------|----------------|
| `project_name` presente | No vacío, no null | Detener — reportar al `project_manager_agent` |
| `objective` presente | No vacío, no null | Detener — reportar al `project_manager_agent` |
| `target_date` presente | Fecha válida o `"TBD"` | Registrar como `TBD` — continuar |
| `tasks` no vacío | Al menos una tarea | Detener — reportar al `project_manager_agent` |
| No duplicado en memoria | `project_name` no existe en `active_projects.md` | Detener — reportar conflicto |
| ClickUp prerequisito | Si alguna tarea tiene `send_to_clickup: true`, `clickup_list_id` debe existir | Marcar esas tareas como `→ memoria` y reportar |

---

## Pasos Mecánicos

### Paso 1 — Normalizar el nombre del proyecto

- Convertir a formato consistente: `Title Case`, sin espacios dobles, sin caracteres especiales salvo guiones y paréntesis
- Generar ID incremental: leer el último `PRJ-XXX` en `active_projects.md` y asignar el siguiente número
- Ejemplo: si el último es `PRJ-003`, asignar `PRJ-004`

### Paso 2 — Mapear prioridades

Convertir la prioridad del proyecto y de cada tarea al esquema del sistema:

| Input | Valor interno | Valor ClickUp |
|-------|--------------|--------------|
| `P1` | urgente | `1` |
| `P2` | alta | `2` |
| `P3` | normal | `3` |
| `P4` | baja | `4` |

### Paso 3 — Mapear estados iniciales de tareas

Todas las tareas recién creadas arrancan en estado `pendiente` salvo indicación explícita del agente.

| Estado recibido | Estado normalizado |
|----------------|-------------------|
| `pendiente` / null / no especificado | `pendiente` |
| `en progreso` | `en progreso` |
| cualquier otro | Reportar ambigüedad — usar `pendiente` |

### Paso 4 — Convertir fechas a timestamps

Para cada tarea con `due_date` en formato `YYYY-MM-DD`, convertir a timestamp en milisegundos para ClickUp:

```
timestamp_ms = new Date('YYYY-MM-DD').getTime()
Ejemplo: '2026-06-15' → 1750032000000
```

Guardar tanto la fecha legible (`YYYY-MM-DD`) como el timestamp en el registro de la tarea.

### Paso 5 — Decidir destino de cada tarea

Para cada tarea en el input:

```
si send_to_clickup == true Y clickup_list_id está disponible:
  → marcar destino: ClickUp
  → incluir en la lista de tareas a enviar
si send_to_clickup == true Y clickup_list_id es null:
  → marcar destino: memoria
  → agregar a lista de advertencias
si send_to_clickup == false:
  → marcar destino: memoria
```

### Paso 6 — Crear tareas en ClickUp

Para cada tarea con destino `ClickUp`, invocar `execution/clickup_create_task.md` con:

```
list_id      → clickup_list_id del proyecto
name         → task.name
description  → task.description
priority     → task.priority (mapeado a número)
due_date     → timestamp en ms
status       → "pendiente" (o el estado mapeado)
```

Comportamiento ante errores:
- Si una tarea falla: registrar el error, continuar con las demás
- No abortar el proceso completo por un fallo individual
- Acumular errores para el reporte final

### Paso 7 — Registrar el proyecto en memoria

Escribir en `memory/active_projects.md` el bloque completo del proyecto con este formato:

```markdown
## {project_name}

- **Project ID**: PRJ-XXX
- **Project Name**: {project_name}
- **Description**: {project_description}
- **Objective**: {objective}
- **Status**: activo
- **Priority**: {priority}
- **Start Date**: {start_date}
- **Target Date**: {target_date}
- **ClickUp Space ID**: {clickup_space_id | null}
- **ClickUp Folder ID**: {clickup_folder_id | null}
- **ClickUp List ID**: {clickup_list_id | null}

### Main Milestones
{milestones como lista de checkboxes con fecha y fase}

### Active Tasks
| Task | Phase | Priority | Due Date | Status | ClickUp ID |
|------|-------|----------|----------|--------|------------|
{fila por cada tarea con su ClickUp ID o null}

### Risks
- Sin riesgos registrados aún

### Decisions
- {start_date}: Proyecto creado.

### Next Actions
- [ ] {primera tarea de la lista} — {fecha}

### Last Sync
- **Fecha**: {start_date si se sincronizó, null si no}
- **Sincronizado por**: {operations_agent | null}
- **Resultado**: {OK con N tareas / No sincronizado}
```

### Paso 8 — Registrar la decisión en decisions_log.md

Agregar al final de `memory/decisions_log.md`:

```markdown
### [DEC-XXX] — Creación del proyecto {project_name}
- **Fecha**: {start_date}
- **Proyecto**: {project_name} ({project_id})
- **Decisión**: Iniciar proyecto. Objetivo: {objective}
- **Contexto**: Proyecto creado desde petición del usuario vía `directives/new_project_creation.md`
- **Alternativas consideradas**: null
- **Impacto esperado**: {objective}
- **Estado**: activo
```

### Paso 9 — Compilar y retornar resultado

Generar el reporte de ejecución con:

```
{
  success: true | false,
  project_id: "PRJ-XXX",
  project_name: "...",
  tasks_total: N,
  tasks_in_clickup: N,
  tasks_in_memory_only: N,
  clickup_ids: { "nombre tarea": "clickup_task_id", ... },
  warnings: [...],   // tareas que no se pudieron enviar a ClickUp
  errors: [...]      // fallos en la creación de tareas
}
```

---

## Reglas Estrictas

- **No inventar objetivos** — si `objective` está vacío, detener y reportar
- **No decidir prioridades** — usar exactamente el valor del input; si es null usar `P3` y reportar
- **No crear tareas nuevas** — solo procesar las tareas recibidas en el input, sin agregar
- **No ejecutar si faltan IDs críticos** — si `project_name` u `objective` son null, no continuar
- **No sobreescribir proyectos existentes** — si el nombre ya existe en `active_projects.md`, detener y reportar el conflicto al `project_manager_agent`
- **No modificar tareas de otros proyectos** — solo escribir el bloque del proyecto en curso
- **Reportar ambigüedades** — cualquier campo con valor inesperado se reporta al `project_manager_agent` antes de continuar

---

## Output Esperado

### Éxito completo

```
✓ Proyecto PRJ-XXX registrado en active_projects.md
✓ N tareas registradas
✓ N tareas enviadas a ClickUp
✓ Decisión DEC-XXX registrada en decisions_log.md
```

### Éxito parcial (sin ClickUp)

```
✓ Proyecto PRJ-XXX registrado en active_projects.md
✓ N tareas registradas en memoria
⚠ 0 tareas enviadas a ClickUp — clickup_list_id no disponible
✓ Decisión DEC-XXX registrada en decisions_log.md
```

### Error crítico

```
✗ Error: project_name vacío — operación abortada
  Reportar a: project_manager_agent
```

### Advertencias (parciales)

```
✓ Proyecto PRJ-XXX registrado
⚠ 2 de 5 tareas fallaron en ClickUp:
  - "Tarea X": 429 rate limit — reintentar
  - "Tarea Y": 400 bad request — revisar status
```

---

## Errores Comunes y Acciones

| Error | Causa probable | Acción |
|-------|---------------|--------|
| `400 Bad Request` en tarea | Status o prioridad inválida | Revisar mapeo — reportar |
| `401 Unauthorized` | Token inválido o expirado | Detener todas las llamadas — reportar al agente |
| `404 Not Found` en list_id | Lista no existe en ClickUp | Marcar `clickup_list_id: null` — continuar sin sync |
| `429 Too Many Requests` | Rate limit alcanzado | Esperar 60s — reintentar una vez — si falla, reportar |
| Nombre duplicado en memoria | Proyecto ya existe | Detener — reportar conflicto |
