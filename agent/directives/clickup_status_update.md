# Directive: ClickUp Status Update

## Objetivo

Actualizar el estado de una tarea existente en ClickUp de forma segura y consistente, evitando inconsistencias entre el sistema de memoria y ClickUp.

---

## Agente Responsable

`operations_agent`

## Skills Requeridas

- `clickup`
- `automation`

---

## Inputs Requeridos

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| `task_id` | ID de la tarea en ClickUp | Sí |
| `new_status` | Nuevo estado (ver tabla de estados) | Sí |
| `context` | Por qué se actualiza el estado | Recomendado |

---

## Tabla de Estados Válidos

| Estado interno | Estado en ClickUp | Cuándo usar |
|---------------|------------------|-------------|
| `pendiente` | `to do` | Tarea creada, no iniciada |
| `en progreso` | `in progress` | Trabajo activo iniciado |
| `bloqueado` | `blocked` | No puede avanzar por dependencia |
| `en revisión` | `review` | Entregable listo para revisión |
| `completado` | `complete` | Tarea finalizada y aprobada |

*Nota: los estados exactos pueden variar por espacio de ClickUp. Ver `app/integrations/clickup/task_mapping.md`.*

---

## Pasos

### Paso 1: Validar inputs
- Confirmar que `task_id` existe en `memory/active_projects.md`
- Verificar que `new_status` es un estado válido para el espacio
- Confirmar que `CLICKUP_API_TOKEN` está disponible

### Paso 2: Verificar estado actual (opcional pero recomendado)
- Obtener tarea: `GET /task/{task_id}`
- Confirmar el estado actual antes de actualizar
- Si el estado ya es el deseado, no ejecutar la actualización (idempotencia)

### Paso 3: Ejecutar la actualización
- Endpoint: `PUT https://api.clickup.com/api/v2/task/{task_id}`
- Body: `{ "status": "[nuevo_estado_clickup]" }`
- Headers: `Authorization: {CLICKUP_API_TOKEN}`, `Content-Type: application/json`
- Ver `app/integrations/clickup/client.md` para implementación

### Paso 4: Verificar respuesta
- Status esperado: `200 OK`
- Confirmar que el estado en la respuesta es el esperado
- Si hay error: registrar y reportar (ver `skills/clickup.md` para manejo de errores)

### Paso 5: Actualizar memoria interna
- Actualizar el estado de la tarea en `memory/active_projects.md`
- Si el estado es `completado`, verificar si la fase o proyecto debe actualizarse también

### Paso 6: Registrar la operación
- Registrar en `memory/session_notes.md`:
  - Tarea actualizada
  - Estado anterior → nuevo estado
  - Fecha de actualización
  - Motivo (si se proporcionó)

---

## Validaciones

- [ ] El `task_id` está registrado en `memory/active_projects.md`
- [ ] El nuevo estado es válido para el espacio de ClickUp
- [ ] La memoria fue actualizada después de la actualización exitosa
- [ ] La operación fue registrada en `session_notes.md`

---

## Edge Cases

**Tarea no encontrada en ClickUp (404):**
→ Verificar si el `task_id` en memoria es correcto. Si la tarea fue eliminada en ClickUp, marcar en memoria como `eliminado_en_clickup` y notificar al usuario.

**Estado inválido para el espacio:**
→ ClickUp retorna `400 Bad Request`. Obtener la lista de estados válidos del espacio y presentarla al usuario para que elija.

**Actualización de múltiples tareas:**
→ Ejecutar una por una, no en batch. Registrar cada resultado individualmente.

**Tarea en estado `completado` → retroceeder:**
→ Advertir al usuario antes de ejecutar. Un retroceso de estado debe ser explícito y justificado.

**Task ID incorrecto en memoria:**
→ No intentar buscar la tarea por nombre en ClickUp de forma automática. Preguntar al usuario el ID correcto.

---

## Outputs Esperados

- Estado de tarea actualizado en ClickUp
- `memory/active_projects.md` actualizado con nuevo estado
- `memory/session_notes.md` con log de la operación
- Confirmación al agente solicitante (éxito o error detallado)
