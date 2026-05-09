# Execution Layer — README

> Esta carpeta contiene scripts mecánicos de ejecución. No contienen lógica de decisión.
> Son llamados por agentes (principalmente `operations_agent`) para ejecutar operaciones repetibles.

---

## Principio

Los scripts de ejecución son **mecánicos**: reciben inputs definidos, ejecutan una operación, y devuelven un resultado. No razonan, no deciden, no se adaptan.

La inteligencia está en los agentes. Los scripts son las manos.

---

## Scripts Disponibles

| Archivo | Operación | Activado por |
|---------|-----------|-------------|
| `project_creator.md` | Registrar proyecto en memoria y crear sus tareas en ClickUp | `operations_agent` via `directives/new_project_creation.md` |
| `clickup_create_task.md` | Crear una tarea en ClickUp | `operations_agent` via `directives/clickup_task_creation.md` |
| `clickup_update_task.md` | Actualizar estado/datos de tarea en ClickUp | `operations_agent` via `directives/clickup_status_update.md` |
| `clickup_sync_tasks.md` | Sincronizar lista completa de tareas | `operations_agent` via `directives/clickup_sync.md` |

---

## Cómo Usar un Script

1. El agente verifica que los inputs requeridos están disponibles
2. El agente llama al script con los parámetros completos
3. El script ejecuta la operación y retorna resultado
4. El agente registra el resultado en memoria

---

## Reglas de los Scripts

- **No modificar memoria** — los scripts no escriben en `/memory/`
- **No tomar decisiones** — si hay ambigüedad, retornar error con detalle
- **Idempotentes cuando sea posible** — ejecutar dos veces no debe crear duplicados
- **Registrar resultado** — siempre retornar éxito o error con detalle
- **Sin credenciales hardcodeadas** — siempre leer de variables de entorno
