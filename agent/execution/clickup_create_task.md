# Script: ClickUp — Create Task

> Script mecánico para crear una tarea en ClickUp.
> No contiene lógica de decisión. Solo ejecuta la operación con los inputs recibidos.

---

## Activado por

`operations_agent` siguiendo `directives/clickup_task_creation.md`

---

## Inputs Requeridos

```
CLICKUP_API_TOKEN   → desde variables de entorno
list_id             → ID de la lista destino en ClickUp
name                → nombre de la tarea (string, no vacío)
description         → descripción detallada (string, puede ser vacío)
status              → estado inicial (default: "to do")
priority            → 1 (urgente) | 2 (alta) | 3 (normal) | 4 (baja)  — default: 3
due_date            → timestamp en milisegundos (opcional)
start_date          → timestamp en milisegundos (opcional)
assignees           → array de user IDs (opcional, default: [])
tags                → array de strings (opcional, default: [])
```

---

## Request

```http
POST https://api.clickup.com/api/v2/list/{list_id}/task
Authorization: {CLICKUP_API_TOKEN}
Content-Type: application/json

{
  "name": "{name}",
  "description": "{description}",
  "status": "{status}",
  "priority": {priority},
  "due_date": {due_date},
  "start_date": {start_date},
  "assignees": {assignees},
  "tags": {tags}
}
```

---

## Outputs

### Éxito (200 OK)
```json
{
  "id": "task_id_generado",
  "name": "nombre de la tarea",
  "status": { "status": "to do" },
  "url": "https://app.clickup.com/t/{task_id}"
}
```
→ Retornar al agente: `{ success: true, task_id: "...", url: "..." }`

### Error
→ Retornar al agente: `{ success: false, error_code: NNN, message: "..." }`

---

## Conversión de Fechas

Para convertir `YYYY-MM-DD` a timestamp en milisegundos:
```
2026-06-15 → new Date('2026-06-15').getTime() → 1750032000000
```

---

## Notas de Implementación

- Ver `app/integrations/clickup/client.md` para el cliente HTTP
- Ver `app/integrations/clickup/auth.md` para el manejo del token
- Ver `app/integrations/clickup/task_mapping.md` para mapeo completo de campos
- En caso de `429 Too Many Requests`: esperar 60 segundos y reintentar una vez
- En caso de `401 Unauthorized`: no reintentar — notificar al agente para verificar token

---

## Implementación de Referencia (Python)

```python
import os
import requests

def create_clickup_task(list_id, task_data):
    token = os.environ.get("CLICKUP_API_TOKEN")
    if not token:
        return {"success": False, "message": "CLICKUP_API_TOKEN no configurado"}

    url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=task_data, headers=headers, timeout=10)

    if response.status_code == 200:
        data = response.json()
        return {"success": True, "task_id": data["id"], "url": data.get("url", "")}
    else:
        return {
            "success": False,
            "error_code": response.status_code,
            "message": response.text
        }
```
