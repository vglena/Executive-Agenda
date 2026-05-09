# Directive: ClickUp Task Creation

## Objetivo

Crear tareas en ClickUp de forma correcta y consistente, asegurando que todos los campos necesarios estén presentes y que el ID resultante quede registrado en la memoria del sistema.

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
| `list_id` | ID de la lista de ClickUp destino | Sí |
| `name` | Nombre de la tarea | Sí |
| `description` | Descripción detallada | Recomendado |
| `status` | Estado inicial | Sí (default: `to do`) |
| `priority` | Prioridad (1=urgente, 2=alta, 3=normal, 4=baja) | Recomendado |
| `due_date` | Fecha límite (timestamp ms) | Recomendado |
| `start_date` | Fecha de inicio (timestamp ms) | Opcional |
| `assignees` | Array de user IDs | Opcional |
| `tags` | Array de etiquetas | Opcional |

---

## Pasos

### Paso 1: Validar inputs
- Confirmar que `list_id` es válido y existe en ClickUp
- Confirmar que `name` no está vacío
- Verificar que `CLICKUP_API_TOKEN` está disponible
- Si falta `due_date`, preguntar al usuario antes de continuar

### Paso 2: Preparar el payload
Construir el objeto de datos para el request:
```json
{
  "name": "[nombre de la tarea]",
  "description": "[descripción]",
  "status": "to do",
  "priority": 3,
  "due_date": [timestamp_ms],
  "start_date": [timestamp_ms],
  "assignees": [],
  "tags": []
}
```

### Paso 3: Ejecutar la creación
- Endpoint: `POST https://api.clickup.com/api/v2/list/{list_id}/task`
- Headers: `Authorization: {CLICKUP_API_TOKEN}`, `Content-Type: application/json`
- Timeout: 10 segundos
- Ver `app/integrations/clickup/client.md` para implementación

### Paso 4: Verificar respuesta
- Status esperado: `200 OK`
- Extraer el `task_id` del response
- Si hay error: registrar y reportar (ver tabla de errores en `skills/clickup.md`)

### Paso 5: Registrar en memoria
- Guardar el `task_id` de ClickUp junto a la tarea en `memory/active_projects.md`
- Formato: `[Nombre tarea] — clickup_id: [task_id]`
- Registrar en `memory/session_notes.md`: tarea creada, ID asignado, fecha

### Paso 6: Confirmar al agente solicitante
- Reportar éxito con el `task_id` creado
- O reportar el error con detalle si falló

---

## Validaciones

- [ ] El `list_id` existe y es accesible con el token actual
- [ ] El nombre de la tarea no está duplicado en la lista
- [ ] El `task_id` fue guardado en `memory/active_projects.md`
- [ ] La operación fue registrada en `memory/session_notes.md`

---

## Edge Cases

**Lista no encontrada (404):**
→ Verificar el ID con el usuario. No intentar crear la lista automáticamente.

**Tarea ya existe con ese nombre:**
→ ClickUp permite nombres duplicados, pero el agente debe advertir al usuario antes de crear.

**Fecha en formato incorrecto:**
→ Las fechas deben enviarse como timestamps en milisegundos. Convertir `YYYY-MM-DD` a timestamp antes del request.

**Sin `assignees` disponibles:**
→ Crear la tarea sin asignado. Registrar que está `[sin asignar]` en memoria.

**Error de red:**
→ Registrar el intento fallido. No crear un duplicado al reintentar sin verificar primero si la tarea fue creada.

---

## Outputs Esperados

- Tarea creada en ClickUp con ID registrado
- `memory/active_projects.md` actualizado con `clickup_task_id`
- `memory/session_notes.md` con log de la operación
- Confirmación al agente solicitante (éxito o error detallado)

---

## Conversión de Fechas

```
YYYY-MM-DD → timestamp en milisegundos

Ejemplo:
2026-06-15 → 1750032000000

Fórmula: new Date('YYYY-MM-DD').getTime()
```
