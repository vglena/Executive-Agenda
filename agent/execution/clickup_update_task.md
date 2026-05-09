# Script: ClickUp — Update Task

> Script mecánico para actualizar una tarea existente en ClickUp.
> No contiene lógica de decisión. Solo ejecuta la actualización con los inputs recibidos.

---

## Activado por

`operations_agent` siguiendo `directives/clickup_status_update.md`

---

## Inputs Requeridos

```
CLICKUP_API_TOKEN   → desde variables de entorno
task_id             → ID de la tarea en ClickUp (string)
```

### Campos Actualizables (al menos uno requerido)

```
status              → nuevo estado (string, debe ser válido en el espacio)
priority            → 1 | 2 | 3 | 4
due_date            → timestamp en milisegundos (o null para eliminar)
start_date          → timestamp en milisegundos (o null para eliminar)
name                → nuevo nombre de la tarea
description         → nueva descripción
assignees           → { add: [user_id], rem: [user_id] }
```

---

## Request

```http
PUT https://api.clickup.com/api/v2/task/{task_id}
Authorization: {CLICKUP_API_TOKEN}
Content-Type: application/json

{
  "status": "{nuevo_estado}",
  "priority": {prioridad},
  "due_date": {timestamp_ms}
}
```

*Solo incluir en el body los campos que se van a actualizar.*

---

## Outputs

### Éxito (200 OK)
```json
{
  "id": "task_id",
  "name": "nombre de la tarea",
  "status": { "status": "nuevo_estado" }
}
```
→ Retornar al agente: `{ success: true, task_id: "...", new_status: "..." }`

### Error
→ Retornar al agente: `{ success: false, error_code: NNN, message: "..." }`

---

## Notas de Implementación

- Ver `app/integrations/clickup/client.md` para el cliente HTTP
- Si el estado no existe en el espacio, la API retorna `400 Bad Request`
- Para obtener estados válidos del espacio: `GET /space/{space_id}` → campo `statuses`
- En caso de `404 Not Found`: la tarea fue eliminada en ClickUp — notificar al agente
- En caso de `429 Too Many Requests`: esperar 60 segundos y reintentar una vez

---

## Implementación de Referencia (Python)

```python
import os
import requests

def update_clickup_task(task_id, updates):
    token = os.environ.get("CLICKUP_API_TOKEN")
    if not token:
        return {"success": False, "message": "CLICKUP_API_TOKEN no configurado"}

    url = f"https://api.clickup.com/api/v2/task/{task_id}"
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }

    response = requests.put(url, json=updates, headers=headers, timeout=10)

    if response.status_code == 200:
        data = response.json()
        return {
            "success": True,
            "task_id": data["id"],
            "new_status": data.get("status", {}).get("status", "")
        }
    else:
        return {
            "success": False,
            "error_code": response.status_code,
            "message": response.text
        }
```
