# Directive: Risk Assessment

## Objetivo

Evaluar sistemáticamente los riesgos activos en proyectos en curso, identificar nuevos riesgos y definir planes de mitigación apropiados.

---

## Agente Responsable

`risk_agent` coordinado por `project_manager_agent`

## Skills Requeridas

- `risk_management`
- `project_management`

---

## Inputs Requeridos

- Estado de proyectos activos (`memory/active_projects.md`)
- Registro de riesgos previos (`memory/risks_log.md`)
- Notas de sesión recientes (`memory/session_notes.md`)

---

## Pasos

### Paso 1: Revisar riesgos existentes
- Leer `memory/risks_log.md`
- Para cada riesgo con estado `Abierto` o `En seguimiento`:
  - Verificar si sigue vigente
  - Actualizar probabilidad e impacto si cambió el contexto
  - Verificar si el plan de mitigación está siendo ejecutado

### Paso 2: Identificar nuevos riesgos
Revisar los siguientes indicadores de riesgo:
- Tareas retrasadas más de 3 días sin justificación
- Tareas sin responsable asignado con fecha límite próxima
- Decisiones pendientes que bloquean trabajo crítico
- Dependencias externas no confirmadas
- Hitos en las próximas 2 semanas sin progreso visible
- Proyectos con múltiples tareas en estado `bloqueado`

### Paso 3: Clasificar cada riesgo
Para cada riesgo identificado:
```
Severidad: Bajo / Medio / Alto / Crítico
Probabilidad: Baja / Media / Alta
Impacto: [qué ocurre si se materializa]
```

### Paso 4: Definir plan de mitigación
Para riesgos de nivel Medio, Alto o Crítico:
- Definir 1-3 acciones concretas de mitigación
- Asignar responsable para cada acción
- Establecer fecha de revisión del riesgo

### Paso 5: Escalar según nivel
- **Bajo**: Registrar y monitorear en próxima revisión semanal
- **Medio**: Incluir en el Weekly Review con plan de acción
- **Alto**: Notificar al `project_manager_agent` inmediatamente
- **Crítico**: Notificar al usuario de forma directa y urgente

### Paso 6: Registrar en memoria
- Actualizar `memory/risks_log.md` con todos los riesgos
- Marcar riesgos resueltos como `Resuelto` (no eliminar)
- Registrar decisiones de mitigación en `memory/decisions_log.md`

---

## Validaciones

- [ ] Todos los riesgos abiertos fueron revisados
- [ ] Los riesgos Alto y Crítico tienen plan de mitigación
- [ ] Los riesgos resueltos están marcados correctamente
- [ ] El `risks_log.md` fue actualizado con fecha de revisión

---

## Edge Cases

**Múltiples riesgos críticos simultáneos:**
→ Escalar inmediatamente al usuario con listado completo. Proponer priorización de cuál atender primero.

**Riesgo que no puede mitigarse:**
→ Registrar como riesgo aceptado con justificación. Notificar al usuario para decisión consciente.

**Riesgo que se materializa:**
→ Cambiar estado a `Materializado`. Registrar impacto real. Activar plan de contingencia si existe. Crear un aprendizaje en `feedback_log.md`.

**No hay información suficiente para evaluar:**
→ Registrar el riesgo como `Información insuficiente`. Definir qué información se necesita y quién debe proveerla.

---

## Outputs Esperados

- `memory/risks_log.md` actualizado
- Listado de riesgos por nivel para el período
- Planes de mitigación documentados
- Escaladas necesarias ejecutadas
- Decisiones de riesgo registradas en `memory/decisions_log.md`
