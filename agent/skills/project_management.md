# Skill: Project Management

## Propósito

Proporcionar el marco conceptual y metodológico para planificar, ejecutar y monitorear proyectos de cualquier tipo y escala.

---

## Capacidades

- Estructurar proyectos en fases, hitos y tareas
- Definir objetivos SMART para proyectos
- Crear y mantener un plan de trabajo
- Monitorear progreso contra el plan
- Gestionar scope, tiempo y calidad
- Identificar dependencias entre tareas
- Priorizar trabajo según impacto y urgencia
- Gestionar cambios y ajustar el plan
- Cerrar proyectos y registrar aprendizajes

---

## Inputs Requeridos

- Nombre del proyecto
- Objetivo principal
- Fecha límite (o estimada)
- Stakeholders clave
- Recursos disponibles (equipo, presupuesto, herramientas)
- Restricciones conocidas

---

## Outputs

- Estructura del proyecto (fases, hitos, tareas)
- Plan de trabajo con fechas
- Estado actualizado del proyecto
- Listado de dependencias
- Prioridades del período
- Recomendaciones de ajuste

---

## Herramientas Compatibles

- ClickUp (via `operations_agent` + skill `clickup`)
- Archivos Markdown en `memory/`
- Cualquier gestor de tareas con API

---

## Límites

- No puede estimar esfuerzo sin input del usuario
- No puede asumir dependencias no declaradas
- No reemplaza el juicio del usuario en decisiones estratégicas
- No gestiona presupuesto o recursos humanos directamente

---

## Conceptos Clave

### Priorización por Impacto-Urgencia
```
Alta urgencia + Alto impacto → Hacer ahora
Alta urgencia + Bajo impacto → Delegar o simplificar
Baja urgencia + Alto impacto → Planificar con cuidado
Baja urgencia + Bajo impacto → Backlog o eliminar
```

### Estados de Tarea
```
pendiente → en progreso → en revisión → completado
                       ↓
                   bloqueado
```

### Fases Estándar de Proyecto
1. Inicio — definición y aprobación
2. Planificación — estructura y recursos
3. Ejecución — desarrollo del trabajo
4. Seguimiento — monitoreo y ajuste
5. Cierre — entrega y retrospectiva

---

## Ejemplos de Uso

**Crear un proyecto nuevo:**
> "Necesito crear un proyecto para lanzar una landing page en 6 semanas."
→ Activar `planning_agent` + seguir `directives/project_intake.md`

**Priorizar trabajo semanal:**
> "¿Qué debo trabajar esta semana?"
→ Leer `memory/active_projects.md` + seguir `directives/task_prioritization.md`

**Revisar estado de proyecto:**
> "¿Cómo va el proyecto X?"
→ Leer `memory/active_projects.md` + activar `reporting_agent`
