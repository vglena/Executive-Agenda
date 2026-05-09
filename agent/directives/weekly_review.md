# Directive: Weekly Review

## Objetivo

Realizar una revisión estructurada del estado de todos los proyectos activos al cierre de cada semana, identificar bloqueos, ajustar prioridades y preparar el trabajo para la próxima semana.

---

## Agente Responsable

`project_manager_agent` con apoyo de `risk_agent` y `reporting_agent`

## Skills Requeridas

- `project_management`
- `reporting`
- `risk_management`
- `calendar`

---

## Inputs Requeridos

- Estado actual de proyectos (`memory/active_projects.md`)
- Riesgos activos (`memory/risks_log.md`)
- Notas de la semana (`memory/session_notes.md`)
- Feedback reciente (`memory/feedback_log.md`)

---

## Pasos

### Paso 1: Revisar estado de proyectos activos
- Leer `memory/active_projects.md`
- Para cada proyecto activo, evaluar:
  - Progreso vs. plan
  - Tareas completadas esta semana
  - Tareas retrasadas o en riesgo
  - Hitos próximos (próximas 2 semanas)

### Paso 2: Identificar bloqueos y riesgos
- Activar `risk_agent` para análisis de bloqueos
- Revisar `memory/risks_log.md` para riesgos pendientes
- Actualizar estado de riesgos existentes

### Paso 3: Sincronizar con ClickUp
- Activar `operations_agent` para leer estado actual de ClickUp
- Comparar estado de tareas en ClickUp vs. estado en memoria
- Resolver inconsistencias (la memoria es fuente de verdad cognitiva)

### Paso 4: Priorizar la próxima semana
- Seguir `directives/task_prioritization.md`
- Seleccionar las 3-5 tareas más importantes por proyecto
- Confirmar fechas límite para la semana siguiente

### Paso 5: Generar reporte semanal
- Activar `reporting_agent`
- Generar Weekly Review Report con formato estándar
- Destacar: logros, bloqueos, próximos pasos

### Paso 6: Actualizar memoria
- Actualizar `memory/active_projects.md` con estado revisado
- Registrar decisiones tomadas en `memory/decisions_log.md`
- Limpiar `memory/session_notes.md` si es necesario
- Actualizar `memory/risks_log.md`

---

## Validaciones

- [ ] Todos los proyectos activos fueron revisados
- [ ] Los riesgos abiertos tienen un plan de acción o fecha de revisión
- [ ] La próxima semana tiene al menos 3 tareas prioritarias definidas por proyecto
- [ ] El estado en memoria es consistente con ClickUp
- [ ] El reporte semanal fue generado

---

## Edge Cases

**No hubo actividad la semana pasada:**
→ Registrar semana sin actividad en `session_notes.md`. Analizar si los proyectos necesitan replanificación.

**Múltiples proyectos con bloqueos simultáneos:**
→ Priorizar los bloqueos por impacto en fecha límite. Escalar al usuario los que no pueden resolverse de forma autónoma.

**Estado de ClickUp inconsistente con memoria:**
→ Preguntar al usuario cuál es la versión correcta. Nunca asumir.

**Proyecto completado durante la semana:**
→ Moverlo a `memory/completed_projects.md`. Registrar fecha de cierre y lecciones aprendidas.

---

## Outputs Esperados

- Reporte Weekly Review generado
- `memory/active_projects.md` actualizado
- `memory/risks_log.md` actualizado
- Prioridades de la próxima semana definidas
- Decisiones registradas en `memory/decisions_log.md`

---

## Formato del Weekly Review Report

```markdown
## Weekly Review — Semana del [fecha inicio] al [fecha fin]

### Resumen Ejecutivo
[2-3 oraciones de estado general]

### Por Proyecto

#### [Nombre Proyecto]
- **Estado**: [en tiempo / en riesgo / retrasado]
- **Progreso**: [X% completado]
- **Completado esta semana**: [lista]
- **Pendiente**: [lista]
- **Bloqueos**: [si hay]
- **Próximo hito**: [nombre] — [fecha]

### Prioridades para la Próxima Semana
1. [Tarea] — [Proyecto] — [Fecha límite]
2. ...

### Riesgos Activos
| ID | Descripción | Nivel | Acción |
|----|-------------|-------|--------|

### Decisiones Tomadas esta Semana
- [decisión] — [fecha] — [impacto]
```
