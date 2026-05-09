# Skill: Risk Management

## Propósito

Identificar, evaluar y gestionar riesgos, bloqueos y dependencias que puedan afectar el éxito de los proyectos.

---

## Capacidades

- Identificar riesgos potenciales en proyectos activos
- Clasificar riesgos por severidad e impacto
- Proponer planes de mitigación
- Detectar bloqueos en tareas actuales
- Mapear dependencias entre tareas y proyectos
- Monitorear evolución de riesgos conocidos
- Registrar riesgos materializados como lecciones aprendidas

---

## Inputs Requeridos

- Estado del proyecto (`memory/active_projects.md`)
- Historial de riesgos (`memory/risks_log.md`)
- Contexto de decisiones pasadas (`memory/decisions_log.md`)

---

## Outputs

- Listado de riesgos identificados con clasificación
- Planes de mitigación por riesgo
- Alertas de bloqueos activos
- Mapa de dependencias críticas

---

## Herramientas Compatibles

- `memory/risks_log.md` — Registro persistente de riesgos
- `directives/risk_assessment.md` — Proceso formal de evaluación

---

## Límites

- No puede predecir riesgos sin información del proyecto
- No resuelve bloqueos — los detecta y escala
- No toma decisiones de mitigación — sugiere opciones

---

## Niveles de Riesgo

| Nivel | Acción |
|-------|--------|
| Bajo | Registrar y monitorear |
| Medio | Plan de acción en próxima revisión |
| Alto | Escalar al PM inmediatamente |
| Crítico | Notificar al usuario de forma urgente |
