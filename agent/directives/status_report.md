# Directive: Status Report

## Objetivo

Generar un informe claro y accionable sobre el estado actual de un proyecto o del portafolio completo.

---

## Agente Responsable

`reporting_agent` coordinado por `project_manager_agent`

## Skills Requeridas

- `reporting`
- `communication`

---

## Inputs Requeridos

- Proyecto(s) a reportar
- Período del informe (fecha inicio - fecha fin)
- Audiencia del informe (equipo / stakeholders / ejecutivo)
- Estado actual (`memory/active_projects.md`)
- Riesgos activos (`memory/risks_log.md`)

---

## Pasos

### Paso 1: Recopilar datos del período
- Leer `memory/active_projects.md` para estado de tareas
- Leer `memory/risks_log.md` para riesgos activos
- Leer `memory/decisions_log.md` para decisiones del período
- Si disponible, leer datos de ClickUp via `operations_agent`

### Paso 2: Calcular indicadores
- Tareas completadas en el período
- Tareas pendientes para el período siguiente
- Tareas vencidas o en riesgo
- Progreso porcentual por fase
- Número de riesgos por nivel

### Paso 3: Redactar resumen ejecutivo
- 2-4 oraciones que capture el estado general
- Tono honesto: incluir logros Y problemas
- No omitir bloqueos o retrasos significativos

### Paso 4: Estructurar el informe
- Usar la plantilla correspondiente a la audiencia
- Equipo: detalle técnico, tareas específicas
- Stakeholders: progreso y bloqueos en lenguaje de negocio
- Ejecutivo: solo semáforo, % completado y riesgos críticos

### Paso 5: Revisión antes de entregar
- Verificar que todos los datos son correctos
- Confirmar que los próximos pasos son accionables y tienen responsable
- No incluir especulaciones — solo hechos y datos disponibles

---

## Validaciones

- [ ] El informe incluye período de cobertura explícito
- [ ] Los indicadores son verificables en la memoria del sistema
- [ ] Los bloqueos incluyen propuesta de acción
- [ ] Los próximos pasos tienen fecha y responsable
- [ ] El tono es apropiado para la audiencia

---

## Edge Cases

**No hay datos suficientes del período:**
→ Generar un informe parcial. Indicar explícitamente qué información falta y por qué.

**Proyecto en estado crítico:**
→ No suavizar el lenguaje. Reportar el estado real con claridad. Destacar en rojo o con `⚠️` si el formato lo permite.

**Audiencia mixta:**
→ Crear dos versiones: una técnica y una ejecutiva.

**Datos de ClickUp inconsistentes con memoria:**
→ Reportar la versión de la memoria. Indicar en nota al pie que hay inconsistencia pendiente de resolver.

---

## Outputs Esperados

- Status Report estructurado según audiencia
- Indicadores del período calculados
- Próximos pasos identificados
- Informe guardado en `memory/session_notes.md`

---

## Plantilla: Status Report (Stakeholders)

```markdown
## Status Report — [Nombre Proyecto]
**Período**: [fecha inicio] → [fecha fin]
**Generado por**: Agente IA — [fecha]

### Estado General: [🟢 En tiempo / 🟡 En riesgo / 🔴 Retrasado]

### Resumen Ejecutivo
[2-4 oraciones sobre estado actual, logros principales y situación de riesgos]

### Progreso
| Fase | Estado | Completado | Fecha estimada |
|------|--------|-----------|----------------|
| ... | ... | ...% | ... |

### Logros del Período
- [logro concreto]

### Bloqueos y Riesgos
- **[Descripción]** — Nivel: [Alto/Medio/Bajo] — Acción: [qué se está haciendo]

### Próximos Pasos
| Acción | Responsable | Fecha |
|--------|-------------|-------|
| ... | ... | ... |
```
