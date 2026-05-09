# Directive: ClickUp Sync

## Objetivo

Sincronizar el estado de los proyectos activos entre la memoria interna del sistema y ClickUp, asegurando consistencia operativa sin sobrescribir el contexto cognitivo.

---

## Agente Responsable

`operations_agent`

## Skills Requeridas

- `clickup`
- `automation`

---

## Inputs Requeridos

- Estado de proyectos en `memory/active_projects.md`
- `CLICKUP_API_TOKEN` (variable de entorno)
- `CLICKUP_TEAM_ID` (variable de entorno)
- IDs de listas de ClickUp por proyecto

---

## Cuándo Ejecutar

- Al finalizar una sesión con cambios en proyectos
- Durante la revisión semanal (`directives/weekly_review.md`)
- Cuando el usuario solicita explícitamente sincronización
- Antes de generar un reporte que incluya datos de ClickUp

---

## Pasos

### Paso 1: Verificar conexión
- Confirmar que `CLICKUP_API_TOKEN` está disponible en variables de entorno
- Ejecutar una petición de verificación: `GET /team/{team_id}` 
- Si falla: reportar error y detener proceso

### Paso 2: Leer estado desde ClickUp
- Para cada proyecto con `clickup_list_id` en memoria:
  - Obtener tareas: `GET /list/{list_id}/task`
  - Registrar: ID, nombre, estado, fecha, asignado

### Paso 3: Comparar con memoria interna
Para cada tarea en memoria con `clickup_task_id`:
- Verificar si existe en ClickUp
- Comparar estado: ¿es igual en ambos lados?
- Identificar tareas en memoria sin ID de ClickUp (nuevas)
- Identificar tareas en ClickUp sin registro en memoria (creadas externamente)

### Paso 4: Resolver inconsistencias

| Situación | Acción |
|-----------|--------|
| Estado diferente en ClickUp vs memoria | Preguntar al usuario cuál prevalece |
| Tarea en memoria sin ID de ClickUp | Crear en ClickUp → registrar ID |
| Tarea en ClickUp no registrada en memoria | Notificar al usuario → agregar a memoria si corresponde |
| Tarea completada en ClickUp, activa en memoria | Actualizar memoria como completada |

### Paso 5: Ejecutar actualizaciones
- Para cada inconsistencia resuelta, ejecutar la acción correspondiente
- Registrar el resultado de cada operación
- En caso de error de API, registrar y continuar con las demás tareas

### Paso 6: Actualizar memoria
- Actualizar IDs de ClickUp en `memory/active_projects.md`
- Registrar la sincronización en `memory/session_notes.md`:
  - Fecha de sincronización
  - Tareas actualizadas
  - Errores encontrados

---

## Validaciones

- [ ] El token de API es válido antes de iniciar
- [ ] Cada proyecto a sincronizar tiene `clickup_list_id` definido
- [ ] No se sobreescribió información cognitiva (decisiones, riesgos) desde ClickUp
- [ ] El resultado de la sincronización fue registrado en `session_notes.md`
- [ ] Las inconsistencias ambiguas fueron escaladas al usuario

---

## Edge Cases

**Token de API inválido o expirado:**
→ Detener sincronización. Notificar al usuario que debe renovar el token en `.env`.

**Lista de ClickUp no encontrada:**
→ Verificar el ID. Si es incorrecto, preguntar al usuario el ID correcto. No crear una nueva lista automáticamente.

**Rate limit alcanzado:**
→ Pausar operación 60 segundos y reintentar. Si persiste, registrar error y continuar con lo que se pudo sincronizar.

**Tarea eliminada en ClickUp:**
→ Notificar al usuario. No eliminar de la memoria del agente — la memoria es la fuente de verdad cognitiva.

**Muchas inconsistencias simultáneas:**
→ Presentar resumen al usuario antes de resolver. No ejecutar cambios masivos sin confirmación.

---

## Outputs Esperados

- Estado sincronizado entre memoria y ClickUp
- `memory/active_projects.md` actualizado con IDs de ClickUp
- `memory/session_notes.md` con log de sincronización
- Reporte de inconsistencias resueltas y pendientes
