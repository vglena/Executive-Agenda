# Script: ClickUp — Sync Tasks

> Script mecánico para leer todas las tareas de una lista de ClickUp y retornarlas para comparación con la memoria interna.
> No modifica memoria ni toma decisiones. Solo lee y retorna datos estructurados.

---

## Activado por

`operations_agent` siguiendo `directives/clickup_sync.md`

---

## Inputs Requeridos

```
CLICKUP_API_TOKEN   → desde variables de entorno
list_id             → ID de la lista a sincronizar
```

### Parámetros Opcionales

```
include_closed      → true/false (incluir tareas completadas, default: false)
page                → número de página para paginación (default: 0)
```

---

## Request

```http
GET https://api.clickup.com/api/v2/list/{list_id}/task?include_closed=false&page=0
Authorization: {CLICKUP_API_TOKEN}
```

---

## Outputs

### Éxito (200 OK)
```json
{
  "tasks": [
    {
      "id": "task_id",
      "name": "nombre de la tarea",
      "status": { "status": "in progress" },
      "priority": { "priority": "normal" },
      "due_date": "1750032000000",
      "start_date": null,
      "assignees": [{ "id": 123, "username": "nombre" }],
      "tags": []
    }
  ]
}
```
→ Retornar al agente: lista estructurada de tareas para comparación

### Datos Estructurados para Comparación

```
[
  {
    clickup_task_id: "abc123",
    name: "nombre de la tarea",
    status: "in progress",
    priority: "normal",
    due_date: "2026-06-15",        ← convertido desde timestamp
    assignees: ["nombre_usuario"],
    tags: []
  }
]
```

### Error
→ Retornar al agente: `{ success: false, error_code: NNN, message: "..." }`

---

## Paginación

ClickUp devuelve máximo 100 tareas por página.
Si la lista tiene más de 100 tareas, incrementar el parámetro `page` y repetir.

---

## Notas de Implementación

- Ver `app/integrations/clickup/client.md` para el cliente HTTP
- Convertir timestamps de milisegundos a `YYYY-MM-DD` para consistencia con memoria
- En caso de `429 Too Many Requests`: esperar 60 segundos y reintentar

---

## Implementación de Referencia (Python)

```python
import os
import requests
from datetime import datetime

def get_clickup_tasks(list_id, include_closed=False):
    token = os.environ.get("CLICKUP_API_TOKEN")
    if not token:
        return {"success": False, "message": "CLICKUP_API_TOKEN no configurado"}

    url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
    headers = {"Authorization": token}
    params = {"include_closed": str(include_closed).lower(), "page": 0}

    all_tasks = []
    while True:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code != 200:
            return {
                "success": False,
                "error_code": response.status_code,
                "message": response.text
            }

        data = response.json()
        tasks = data.get("tasks", [])
        all_tasks.extend(tasks)

        if len(tasks) < 100:
            break
        params["page"] += 1

    # Normalizar datos
    normalized = []
    for task in all_tasks:
        due_ts = task.get("due_date")
        due_date = datetime.fromtimestamp(int(due_ts)/1000).strftime('%Y-%m-%d') if due_ts else None
        normalized.append({
            "clickup_task_id": task["id"],
            "name": task["name"],
            "status": task.get("status", {}).get("status", ""),
            "priority": task.get("priority", {}).get("priority", "normal") if task.get("priority") else "normal",
            "due_date": due_date,
            "assignees": [a.get("username", "") for a in task.get("assignees", [])],
            "tags": [t.get("name", "") for t in task.get("tags", [])]
        })

    return {"success": True, "tasks": normalized, "count": len(normalized)}
```
