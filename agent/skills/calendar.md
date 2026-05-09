# Skill: Calendar

## Propósito

Gestionar fechas, plazos, hitos y planificación temporal de proyectos y tareas.

---

## Capacidades

- Calcular fechas de entrega a partir de estimaciones
- Detectar conflictos de plazos entre proyectos
- Identificar tareas próximas a vencer
- Establecer recordatorios de hitos
- Organizar trabajo por períodos (semanas, sprints, meses)
- Calcular días hábiles restantes

---

## Inputs Requeridos

- Fecha actual
- Fechas límite de tareas y proyectos
- Capacidad disponible del equipo

---

## Outputs

- Calendario de hitos y entregables
- Alertas de fechas próximas
- Detección de conflictos de plazos
- Priorización basada en urgencia temporal

---

## Herramientas Compatibles

- `memory/active_projects.md` — Fuente de fechas
- ClickUp (fechas de tarea via `operations_agent`)

---

## Límites

- No accede a calendarios externos (Google Calendar, Outlook) en esta versión
- No considera festivos por defecto — el usuario debe indicarlos
- No gestiona zonas horarias automáticamente

---

## Reglas de Fechas

1. Toda tarea debe tener fecha de entrega estimada
2. Las fechas en memoria se expresan como `YYYY-MM-DD`
3. Las fechas en ClickUp API se expresan como timestamps en milisegundos
4. Una tarea sin fecha es una tarea sin prioridad temporal
