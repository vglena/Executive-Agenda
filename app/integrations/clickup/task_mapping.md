# ClickUp Task Mapping

> Mapeo entre el modelo de datos interno del sistema y los campos de la API de ClickUp.

---

## Mapeo de Campos: Sistema → ClickUp

| Campo Interno | Campo ClickUp API | Tipo | Notas |
|---------------|------------------|------|-------|
| `name` | `name` | string | Requerido |
| `description` | `description` | string | Markdown soportado |
| `status` | `status` | string | Ver tabla de estados |
| `priority` | `priority` | integer | 1=urgente, 2=alta, 3=normal, 4=baja |
| `due_date` | `due_date` | integer (ms) | Timestamp en milisegundos |
| `start_date` | `start_date` | integer (ms) | Timestamp en milisegundos |
| `assignees` | `assignees` | array[int] | Array de user IDs |
| `tags` | `tags` | array[string] | Nombres de etiquetas |
| `clickup_task_id` | `id` | string | Generado por ClickUp |
| `clickup_list_id` | ID de lista | string | Configurable por proyecto |

---

## Mapeo de Estados

> Los estados en ClickUp son configurables por espacio. Esta es la tabla de mapeo por defecto.
> Si el workspace tiene estados personalizados, actualizar esta tabla.

| Estado Interno | Estado en ClickUp | Color sugerido |
|---------------|------------------|----------------|
| `pendiente` | `to do` | gris |
| `en progreso` | `in progress` | azul |
| `bloqueado` | `blocked` | rojo |
| `en revisión` | `review` | amarillo |
| `completado` | `complete` | verde |

### Obtener estados reales del espacio

```http
GET https://api.clickup.com/api/v2/space/{space_id}
Authorization: {CLICKUP_API_TOKEN}
```

Campo `statuses` en la respuesta contiene los estados válidos para ese espacio.

---

## Mapeo de Prioridades

| Prioridad Interna | Valor ClickUp | Etiqueta ClickUp |
|------------------|---------------|-----------------|
| `crítica` | 1 | Urgent |
| `alta` | 2 | High |
| `normal` | 3 | Normal |
| `baja` | 4 | Low |

---

## Conversión de Fechas

Las fechas internas se expresan como `YYYY-MM-DD`.
La API de ClickUp requiere timestamps en **milisegundos**.

```python
from datetime import datetime

def date_to_ms(date_str: str) -> int:
    """Convierte 'YYYY-MM-DD' a timestamp en milisegundos."""
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    return int(dt.timestamp() * 1000)

def ms_to_date(timestamp_ms: int) -> str:
    """Convierte timestamp en milisegundos a 'YYYY-MM-DD'."""
    return datetime.fromtimestamp(timestamp_ms / 1000).strftime('%Y-%m-%d')
```

---

## IDs Importantes

Los siguientes IDs deben configurarse en memoria o en preferencias:

| ID | Dónde encontrarlo | Dónde guardarlo |
|----|------------------|----------------|
| Team ID | URL de ClickUp: `/t/{team_id}/` | `.env` como `CLICKUP_TEAM_ID` |
| Space ID | URL: `/s/{space_id}` | `memory/user_preferences.md` |
| List ID | URL: `/l/{list_id}` | `memory/active_projects.md` por proyecto |
| Task ID | Retornado al crear tarea | `memory/active_projects.md` por tarea |

---

## Notas Adicionales

- Los campos `due_date` y `start_date` aceptan `null` para eliminar la fecha
- El campo `assignees` para actualización usa `{ "add": [], "rem": [] }`
- Las etiquetas (`tags`) deben existir en el espacio antes de asignarse a una tarea
