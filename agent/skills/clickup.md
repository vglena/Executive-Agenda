# Skill: ClickUp

## Propósito

Conectar el sistema cognitivo del agente con ClickUp como herramienta operativa externa para sincronizar tareas, estados y actividad de proyectos.

---

## Capacidades

- Leer tareas desde ClickUp
- Crear tareas en ClickUp
- Actualizar estados de tareas
- Asignar responsables
- Sincronizar fechas de inicio y entrega
- Leer comentarios y actividad
- Generar reportes desde datos de ClickUp
- Registrar bloqueos y riesgos detectados en ClickUp
- Sincronizar prioridades
- Detectar cambios de estado
- Relacionar proyectos internos con espacios o listas de ClickUp

---

## Inputs Requeridos

- `CLICKUP_API_TOKEN` — Personal API Token (variable de entorno)
- `CLICKUP_TEAM_ID` — ID del workspace
- ID de lista o espacio destino
- Datos de la tarea (nombre, descripción, estado, fechas, asignado, prioridad)

---

## Outputs

- Tarea creada con ID de ClickUp
- Estado actualizado de tarea
- Lista de tareas leídas desde ClickUp
- Confirmación de sincronización exitosa
- Registro de errores de API

---

## Endpoints Principales de ClickUp API

| Operación | Método | Endpoint |
|-----------|--------|----------|
| Obtener espacios | GET | `/team/{team_id}/space` |
| Obtener listas | GET | `/space/{space_id}/list` |
| Obtener tareas de lista | GET | `/list/{list_id}/task` |
| Crear tarea | POST | `/list/{list_id}/task` |
| Actualizar tarea | PUT | `/task/{task_id}` |
| Obtener tarea | GET | `/task/{task_id}` |
| Obtener comentarios | GET | `/task/{task_id}/comment` |
| Crear comentario | POST | `/task/{task_id}/comment` |

Base URL: `https://api.clickup.com/api/v2`

---

## Mapeo de Campos

| Campo interno | Campo en ClickUp API |
|--------------|---------------------|
| nombre | `name` |
| descripción | `description` |
| estado | `status` |
| prioridad | `priority` (1=urgente, 2=alta, 3=normal, 4=baja) |
| fecha inicio | `start_date` (timestamp ms) |
| fecha fin | `due_date` (timestamp ms) |
| asignado | `assignees` (array de user IDs) |
| etiquetas | `tags` |

---

## Sincronización

### Reglas de sincronización:
1. La memoria interna es la **fuente de verdad cognitiva**
2. ClickUp es la **fuente operativa** de estados actuales
3. En conflicto: preguntar al usuario cuál prevalece
4. Sincronización es unidireccional por defecto (agente → ClickUp)
5. Lectura bidireccional solo en revisiones explícitas

### Frecuencia recomendada:
- Al crear una tarea nueva → sincronizar inmediatamente
- Al cambiar estado → sincronizar inmediatamente
- Revisión semanal → leer estado desde ClickUp y comparar

---

## Manejo de Errores

| Error | Causa probable | Acción |
|-------|---------------|--------|
| `401 Unauthorized` | Token inválido o expirado | Verificar `CLICKUP_API_TOKEN` en `.env` |
| `404 Not Found` | ID de lista/tarea incorrecto | Verificar IDs en `memory/active_projects.md` |
| `429 Too Many Requests` | Rate limit superado | Esperar 60 segundos y reintentar |
| `400 Bad Request` | Datos mal formados | Revisar formato de campos en `task_mapping.md` |
| `500 Server Error` | Error de ClickUp | Reintentar después de 5 minutos |

---

## Límites de API

- Rate limit: 100 requests / minuto por token
- Tamaño máximo de descripción: 10.000 caracteres
- Máximo de asignados por tarea: 50
- Máximo de etiquetas por tarea: 10

---

## Reglas de Actualización

1. Nunca actualizar una tarea en ClickUp sin tener el `task_id` guardado
2. Verificar que el estado destino existe en el espacio antes de actualizar
3. Registrar en `memory/active_projects.md` el `task_id` de cada tarea creada
4. En caso de error, no reintentar automáticamente más de 2 veces
5. Reportar errores al `project_manager_agent` con el detalle completo

---

## Herramientas Compatibles

- `app/integrations/clickup/client.md` — Implementación del cliente HTTP
- `app/integrations/clickup/auth.md` — Gestión de autenticación
- `app/integrations/clickup/task_mapping.md` — Mapeo detallado de campos
- `agent/execution/clickup_create_task.md` — Script de creación
- `agent/execution/clickup_update_task.md` — Script de actualización
- `agent/execution/clickup_sync_tasks.md` — Script de sincronización

---

## Límites

- No modifica la estructura de espacios o listas en ClickUp
- No gestiona usuarios o permisos del workspace
- No accede a datos de múltiples workspaces simultáneamente
- No maneja archivos adjuntos en esta versión
