# Directive: Meeting Summary

## Objetivo

Convertir notas crudas de una reunión en un acta estructurada con decisiones claras, acciones asignadas y contexto para el agente.

---

## Agente Responsable

`reporting_agent`

## Skills Requeridas

- `reporting`
- `communication`

---

## Inputs Requeridos

- Notas o transcripción de la reunión
- Fecha y duración de la reunión
- Lista de participantes
- Proyecto(s) relacionados

---

## Pasos

### Paso 1: Leer las notas de la reunión
- Identificar el tema central y objetivo de la reunión
- Extraer menciones de proyectos, tareas o entregables
- Identificar tonos de urgencia o preocupación

### Paso 2: Extraer decisiones
- Listar solo las decisiones explícitas tomadas
- Cada decisión debe ser atribuible: quién decidió, sobre qué
- No inferir decisiones que no fueron explícitas

### Paso 3: Extraer acciones (action items)
- Listar todas las acciones comprometidas con responsable y fecha
- Si no hay fecha, preguntar al usuario cuál es
- Si no hay responsable, marcarlo como `[sin asignar]`

### Paso 4: Identificar temas pendientes
- Listar temas que quedaron sin resolver o para seguimiento
- Marcar si requieren una reunión de seguimiento

### Paso 5: Actualizar memoria del sistema
- Registrar decisiones en `memory/decisions_log.md`
- Agregar nuevas tareas a `memory/active_projects.md` si aplica
- Registrar riesgos mencionados en `memory/risks_log.md`
- Guardar el acta en `memory/session_notes.md`

---

## Validaciones

- [ ] Todas las decisiones tienen atribución (quién decidió)
- [ ] Todos los action items tienen responsable (o marcados como `[sin asignar]`)
- [ ] Las fechas comprometidas son concretas o están marcadas como `TBD`
- [ ] El acta fue registrada en `memory/session_notes.md`
- [ ] Las nuevas tareas fueron agregadas a `memory/active_projects.md`

---

## Edge Cases

**Las notas son muy escuetas o incompletas:**
→ Generar el acta con la información disponible. Marcar secciones como `[Información no disponible]`. Preguntar al usuario por las partes faltantes.

**La reunión generó múltiples action items para distintos proyectos:**
→ Agregar cada acción al proyecto correspondiente en memoria. No mezclarlos en una sola lista genérica.

**Se tomaron decisiones que contradicen decisiones previas:**
→ Registrar la nueva decisión con nota de que reemplaza la anterior. Actualizar `decisions_log.md` con referencia cruzada.

**La reunión fue informal y sin agenda:**
→ Estructurar igual el acta. Si no hay decisiones formales, documentar "Alineación / Sin decisiones formales".

---

## Outputs Esperados

- Acta de reunión estructurada
- `memory/decisions_log.md` actualizado
- `memory/active_projects.md` actualizado con nuevas tareas
- `memory/risks_log.md` actualizado si se mencionaron riesgos

---

## Plantilla: Acta de Reunión

```markdown
## Acta de Reunión — [Fecha]

**Participantes**: [lista]
**Duración**: [X minutos]
**Proyecto(s) relacionados**: [lista]

### Objetivo de la Reunión
[Una oración sobre por qué se realizó]

### Decisiones Tomadas
| # | Decisión | Tomada por | Fecha |
|---|----------|-----------|-------|
| 1 | [descripción] | [persona] | [fecha] |

### Action Items
| Acción | Responsable | Fecha límite | Estado |
|--------|-------------|-------------|--------|
| [descripción] | [nombre] | [fecha] | pendiente |

### Temas Pendientes / Seguimiento
- [tema que quedó sin resolver]

### Notas Adicionales
[contexto relevante que no encaja en categorías anteriores]
```
