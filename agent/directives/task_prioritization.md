# Directive: Task Prioritization

## Objetivo

Determinar el orden de trabajo más efectivo para un período dado, maximizando el impacto y minimizando el riesgo de incumplimiento de fechas.

---

## Agente Responsable

`project_manager_agent`

## Skills Requeridas

- `project_management`
- `calendar`

---

## Inputs Requeridos

- Lista de tareas pendientes del período
- Fechas límite de cada tarea
- Estado de proyectos activos (`memory/active_projects.md`)
- Riesgos activos (`memory/risks_log.md`)

---

## Pasos

### Paso 1: Recopilar todas las tareas pendientes
- Leer `memory/active_projects.md`
- Listar todas las tareas con estado `pendiente` o `en progreso`
- Incluir fecha límite, proyecto asociado y bloqueos conocidos

### Paso 2: Aplicar matriz de priorización
Para cada tarea, evaluar:
- **Urgencia**: ¿Cuántos días faltan para la fecha límite?
- **Impacto**: ¿Qué ocurre si no se completa esta semana?
- **Dependencias**: ¿Otras tareas dependen de esta?
- **Bloqueo**: ¿Está actualmente bloqueada?

### Paso 3: Clasificar tareas

| Cuadrante | Urgencia | Impacto | Acción |
|-----------|---------|---------|--------|
| P1 — Hacer hoy | Alta | Alto | Prioridad máxima |
| P2 — Planificar | Baja | Alto | Asignar tiempo esta semana |
| P3 — Delegar/simplificar | Alta | Bajo | Hacer rápido o eliminar |
| P4 — Backlog | Baja | Bajo | Mover al backlog |

### Paso 4: Considerar dependencias
- Las tareas que desbloquean otras deben priorizarse aunque su impacto individual sea menor
- Registrar el árbol de dependencias si es complejo

### Paso 5: Confirmar con el usuario
- Presentar las top 5-7 tareas priorizadas
- Preguntar si hay contexto adicional que cambie el orden
- No proceder a la ejecución sin confirmación para proyectos de alto impacto

### Paso 6: Actualizar memoria
- Marcar las tareas priorizadas en `memory/active_projects.md`
- Registrar el razonamiento si la priorización fue no obvia

---

## Validaciones

- [ ] Todas las tareas tienen fecha límite (o se registra como `TBD`)
- [ ] Las tareas bloqueadas están marcadas como `bloqueado`
- [ ] No hay tareas de P1 sin responsable asignado
- [ ] La lista de prioridades fue confirmada por el usuario (para períodos largos)

---

## Edge Cases

**Todas las tareas son urgentes:**
→ Aplicar criterio de impacto primero. Si todo es urgente e importante, escalar al usuario para priorizar con contexto de negocio.

**Tarea bloqueada en P1:**
→ Registrar como bloqueo crítico. Activar `risk_agent`. Proponer alternativas al usuario.

**Tarea sin fecha límite:**
→ No puede estar en P1. Asignar a P4 hasta que tenga fecha. Preguntar al usuario por la fecha.

**Cambio de prioridades durante la semana:**
→ Re-ejecutar esta directiva con el nuevo contexto. Registrar el cambio en `decisions_log.md`.

---

## Outputs Esperados

- Lista priorizada de tareas para el período
- Justificación de las top 3 prioridades
- Tareas bloqueadas identificadas y escaladas
- `memory/active_projects.md` actualizado con prioridades
