# ClickUp Webhook Handler

> Procesamiento de eventos webhook entrantes desde ClickUp.
> Permite al sistema reaccionar a cambios que ocurren directamente en ClickUp.

---

## Estado

Pendiente de implementación completa. Diseño inicial documentado.

---

## Propósito

Recibir notificaciones de ClickUp cuando ocurren cambios en tareas, como:
- Cambio de estado de una tarea
- Asignación de responsable
- Actualización de fecha límite
- Creación de comentario
- Tarea completada

Estos eventos permiten mantener la memoria del sistema sincronizada con ClickUp sin polling constante.

---

## Configuración del Webhook en ClickUp

1. Ir a **ClickUp Settings** → **Integrations** → **Webhooks**
2. Crear nuevo webhook con URL del servidor: `https://tu-servidor.com/api/webhooks/clickup`
3. Seleccionar eventos a escuchar (ver tabla de eventos)
4. Guardar el `webhook_secret` para validación de firma

---

## Eventos Soportados

| Evento ClickUp | Acción del Sistema |
|---------------|-------------------|
| `taskStatusUpdated` | Actualizar estado en `memory/active_projects.md` |
| `taskDueDateUpdated` | Actualizar fecha en memoria |
| `taskAssigneeUpdated` | Actualizar asignado en memoria |
| `taskCommentPosted` | Registrar en `memory/session_notes.md` si es relevante |
| `taskDeleted` | Marcar como eliminado en memoria, notificar al agente |

---

## Estructura del Payload Recibido

```json
{
  "event": "taskStatusUpdated",
  "task_id": "abc123",
  "history_items": [
    {
      "field": "status",
      "before": { "status": "to do" },
      "after": { "status": "in progress" }
    }
  ],
  "webhook_id": "webhook_id"
}
```

---

## Implementación del Endpoint (Python / FastAPI)

```python
from fastapi import FastAPI, Request, Header, HTTPException
import hmac
import hashlib
import os

app = FastAPI()

@app.post("/api/webhooks/clickup")
async def clickup_webhook(
    request: Request,
    x_signature: str = Header(None)
):
    body = await request.body()

    # Validar firma del webhook
    secret = os.environ.get("CLICKUP_WEBHOOK_SECRET", "")
    expected_sig = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, x_signature or ""):
        raise HTTPException(status_code=401, detail="Firma inválida")

    payload = await request.json()
    event = payload.get("event")

    # Enrutar el evento al handler correspondiente
    handlers = {
        "taskStatusUpdated": handle_status_update,
        "taskDueDateUpdated": handle_due_date_update,
        "taskDeleted": handle_task_deleted,
    }

    handler = handlers.get(event)
    if handler:
        await handler(payload)

    return {"received": True}
```

---

## Seguridad

- Validar la firma (`X-Signature`) en cada webhook recibido
- El `CLICKUP_WEBHOOK_SECRET` se configura en `.env`
- Rechazar requests sin firma válida con `401 Unauthorized`
- No procesar eventos de workspaces no reconocidos

---

## Notas

- En la versión inicial, el sistema puede operar sin webhooks (polling manual)
- Los webhooks son una optimización para mantener sincronía en tiempo real
- El endpoint debe estar disponible públicamente (o via ngrok en desarrollo)
