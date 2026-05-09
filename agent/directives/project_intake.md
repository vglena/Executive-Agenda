# Directive: Project Intake

## Objetivo

Estructurar el proceso de inicio de un proyecto nuevo, asegurando que toda la información necesaria esté recopilada y organizada antes de comenzar la ejecución.

---

## Agente Responsable

`planning_agent` coordinado por `project_manager_agent`

## Skills Requeridas

- `project_management`
- `calendar`

---

## Inputs Requeridos

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Nombre del proyecto | Identificador único del proyecto | Sí |
| Objetivo principal | Qué debe lograrse al finalizar | Sí |
| Fecha límite | Fecha de entrega o lanzamiento | Sí |
| Stakeholders | Personas clave involucradas | Sí |
| Contexto / background | Por qué existe este proyecto | Recomendado |
| Restricciones | Limitaciones conocidas de tiempo, recursos o scope | Recomendado |
| ID de lista en ClickUp | Lista de ClickUp donde vivirán las tareas | Opcional |

---

## Pasos

### Paso 1: Recopilar información
- Preguntar al usuario por los inputs requeridos
- No continuar hasta tener: nombre, objetivo y fecha límite
- Registrar restricciones o limitaciones mencionadas

### Paso 2: Validar viabilidad
- Confirmar que la fecha límite es realista para el objetivo declarado
- Si hay dudas, plantear al usuario antes de continuar
- Identificar dependencias externas no resueltas

### Paso 3: Definir estructura del proyecto
- Dividir el proyecto en fases (máximo 5 para proyectos medianos)
- Para cada fase, definir: nombre, objetivo, fecha de cierre
- Identificar los hitos principales (puntos de control)

### Paso 4: Generar lista de tareas iniciales
- Para cada fase, generar 3-7 tareas concretas y accionables
- Cada tarea debe tener: nombre, descripción breve, prioridad, fecha estimada
- Identificar la primera tarea a ejecutar para comenzar el momentum

### Paso 5: Registrar en memoria
- Guardar el proyecto en `memory/active_projects.md` con formato estándar
- Registrar la decisión de iniciar el proyecto en `memory/decisions_log.md`

### Paso 6: Sincronizar con ClickUp (opcional)
- Si el usuario tiene una lista de ClickUp disponible, activar `operations_agent`
- Crear tareas en ClickUp usando `directives/clickup_task_creation.md`
- Guardar los IDs de tareas creadas en `memory/active_projects.md`

---

## Validaciones

- [ ] El nombre del proyecto es único (no duplica proyectos activos)
- [ ] El objetivo es específico y medible
- [ ] La fecha límite es una fecha concreta (no "pronto" o "cuando sea posible")
- [ ] Hay al menos una tarea con fecha para la primera semana
- [ ] El proyecto fue registrado en `memory/active_projects.md`

---

## Edge Cases

**No hay fecha límite definida:**
→ Preguntar si el proyecto es "indefinido" o si la fecha es por confirmar. Registrar como `TBD` en memoria y revisar en la próxima sesión.

**El objetivo es muy amplio:**
→ Pedir al usuario que lo refine. Sugerir dividir en sub-proyectos si el scope es excesivo para una sola entidad.

**Proyecto duplicado:**
→ Revisar `memory/active_projects.md`. Si ya existe, no crear uno nuevo — actualizar el existente.

**Sin lista de ClickUp disponible:**
→ Continuar sin sincronización. Registrar `clickup_list_id: null` en memoria para sincronizar luego.

---

## Outputs Esperados

- Proyecto registrado en `memory/active_projects.md`
- Estructura de fases y hitos documentada
- Lista de tareas iniciales creada
- Decisión registrada en `memory/decisions_log.md`
- (Opcional) Tareas creadas en ClickUp con IDs guardados

---

## Formato de Registro en Memoria

```markdown
## [Nombre del Proyecto]
- **ID**: PRJ-001
- **Estado**: activo
- **Objetivo**: [descripción clara]
- **Fecha inicio**: YYYY-MM-DD
- **Fecha límite**: YYYY-MM-DD
- **Stakeholders**: [lista]
- **ClickUp list ID**: [ID o null]
- **Fases**:
  - Fase 1: [nombre] — [fecha fin]
  - Fase 2: [nombre] — [fecha fin]
- **Hitos**:
  - [ ] [Hito] — [fecha]
- **Tareas activas**:
  - [ ] [Tarea] — [prioridad] — [fecha] — [ClickUp task ID o null]
```
