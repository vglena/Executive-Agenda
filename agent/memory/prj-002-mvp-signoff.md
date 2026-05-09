# PRJ-002 — Sign-Off Funcional del MVP
## Asistente IA de Agenda Ejecutiva

> **DOCUMENTO OFICIAL DE CIERRE FUNCIONAL**
> Estado: **APROBADO Y CONGELADO**
> Fecha de aprobación: 2026-05-08
> Aprobado por: usuario
> Decisión registrada: DEC-006
>
> A partir de este documento, el diseño funcional del MVP está cerrado.
> Cualquier cambio de alcance requiere una nueva decisión explícita.
> El siguiente paso es el diseño de arquitectura técnica.

---

## 1. Resumen Ejecutivo del MVP

El **Asistente IA de Agenda Ejecutiva** es un sistema de gestión de agenda inteligente para un único ejecutivo. Su propósito central es eliminar la dispersión cognitiva diaria: el ejecutivo no tiene que decidir qué revisar, qué atender primero ni qué tiene olvidado. El sistema lo hace por él.

### En una frase

> Un asistente personal que centraliza la agenda del ejecutivo, prioriza sus tareas con IA y le entrega cada mañana un briefing ejecutivo listo para empezar el día.

### Contexto

| Atributo | Valor |
|----------|-------|
| **Tipo de sistema** | Asistente IA de agenda personal |
| **Usuario** | 1 ejecutivo (persona física, usuario único) |
| **Módulos** | 5 — Calendario, Tareas, Recordatorios, Priorización IA, Resumen Diario |
| **Integración externa** | Google Calendar — opcional, no bloquea el uso del sistema |
| **Entidades de datos** | 6 (Ejecutivo, Evento, Tarea, Recordatorio, PriorizaciónDiaria, ResumenDiario) |
| **Uso de LLM** | 3 campos generados por IA: justificaciones, sugerencia del día, contenido del resumen |
| **Deadline del MVP** | 2026-09-08 |

### Qué entrega el MVP al ejecutivo

1. **Ver el día entero de un vistazo** — agenda + tareas + prioridades en la pantalla principal.
2. **Capturar tareas en ≤10 segundos** — sin fricción, sin formularios largos.
3. **Saber qué atender primero** — la IA calcula y justifica las prioridades del día.
4. **No olvidar nada** — recordatorios automáticos en horario laboral.
5. **Empezar el día orientado** — briefing ejecutivo de ≤300 palabras listo a las 07:30.

---

## 2. Lista Final de Funcionalidades del MVP

> 29 funcionalidades en 5 módulos. Todas congeladas.

### 2.1 Calendario — 8 funcionalidades

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| C-01 | Vista diaria (eventos del día, orden cronológico) | P1 |
| C-02 | Vista semanal (eventos por día) | P2 |
| C-03 | Crear evento manual (título, fecha, hora inicio/fin, descripción, recordatorio) | P1 |
| C-04 | Editar evento | P1 |
| C-05 | Eliminar evento (con confirmación) | P1 |
| C-06 | Sincronización con Google Calendar (opcional — solo lectura, automática) | P2 |
| C-07 | Conectar / desconectar Google Calendar desde Configuración | P2 |
| C-08 | Detección visual de conflictos de horario | P2 |

### 2.2 Tareas — 7 funcionalidades

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| T-01 | Crear tarea mínima (solo título, ≤10 seg) | P1 |
| T-02 | Crear tarea completa (título, descripción, fecha límite, prioridad P1–P4) | P1 |
| T-03 | Editar tarea | P1 |
| T-04 | Eliminar tarea (con confirmación) | P1 |
| T-05 | Completar tarea (desaparece de vista activa) | P1 |
| T-06 | Vista de tareas del día (fecha límite = hoy, por prioridad) | P1 |
| T-07 | Vista de tareas pendientes + historial de completadas | P2 |

### 2.3 Recordatorios — 5 funcionalidades

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| R-01 | Crear recordatorio vinculado a tarea o evento | P1 |
| R-02 | Opciones de tiempo: 15 min, 30 min, 1 h, 3 h, 1 día, hora personalizada | P1 |
| R-03 | Alerta in-app con acción "Ver" (navega al elemento) | P1 |
| R-04 | Vista de recordatorios activos del día | P2 |
| R-05 | Desactivar recordatorio sin borrar la tarea/evento | P1 |

### 2.4 Priorización IA — 5 funcionalidades

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| P-01 | Lista diaria de hasta 5 tareas priorizadas (generada a las 07:30) | P1 |
| P-02 | Score calculado: urgencia + impacto (prioridad manual) + carga del día | P1 |
| P-03 | Justificación de 1 frase por tarea priorizada | P1 |
| P-04 | Rechazo de sugerencia + recálculo en ≤5 seg | P1 |
| P-05 | Recálculo automático en background al cambiar tareas o eventos del día | P2 |

### 2.5 Resumen Diario — 4 funcionalidades

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| D-01 | Generación automática a hora configurable (default: 07:30) | P1 |
| D-02 | Contenido: agenda del día · vencidos sin completar · top 3 prioritarias · sugerencia IA | P1 |
| D-03 | Formato: texto ejecutivo ≤300 palabras, ítem navegable al pulsar | P1 |
| D-04 | Configuración de hora de generación (≤3 pasos) | P2 |

---

## 3. Exclusiones Confirmadas

> 14 funcionalidades explícitamente fuera del MVP v1.
> No entran sin decisión explícita del usuario.

| # | Funcionalidad excluida | Candidata para |
|---|------------------------|---------------|
| E-01 | Multi-usuario / colaboración | v2 |
| E-02 | Compartir agenda con terceros | v2 |
| E-03 | App móvil nativa (iOS / Android) | v2 |
| E-04 | Integración con email (lectura / envío) | v2 |
| E-05 | Integración con Slack / Teams / WhatsApp | v2 |
| E-06 | Gestión de proyectos o sprints | v3+ |
| E-07 | Análisis histórico y reportes de productividad | v2 |
| E-08 | Subtareas y checklists | v2 |
| E-09 | Adjuntos en tareas y notas extendidas | v2 |
| E-10 | Gestión de contactos (CRM) | fuera del scope del producto |
| E-11 | Integración con Outlook / iCloud Calendar | v2 |
| E-12 | Facturación y time tracking | fuera del scope del producto |
| E-13 | Videollamadas integradas | fuera del scope del producto |
| E-14 | Múltiples calendarios por usuario | v2 |

---

## 4. Riesgos Aceptados

> El ejecutivo conoce estos riesgos y aprueba avanzar con el diseño técnico asumiendo que existen.
> Se gestionarán durante la ejecución, no son bloqueantes para iniciar.

### Aceptados sin plan de mitigación activo (riesgo bajo o inherente al concepto)

| ID | Riesgo | Severidad | Decisión |
|----|--------|-----------|---------|
| RR-012 | Pérdida del ranking diario ante fallo del sistema | Bajo | Aceptado — el ranking es recalculable desde los datos base |

### En seguimiento durante el desarrollo

| ID | Riesgo | Severidad | Plan resumido |
|----|--------|-----------|---------------|
| RR-001 | Scope creep del MVP | Alto | Alcance congelado en este documento; backlog post-MVP separado |
| RR-004 | Priorización IA irrelevante al inicio por falta de historial | Medio | Onboarding con calibración inicial; comunicar en UI que la IA mejora con el uso |
| RR-005 | Resumen diario percibido como genérico | Medio | Validar relevancia con el ejecutivo real en Fase 3; prompt con contexto dinámico |
| RR-006 | Recordatorios en horarios inapropiados | Bajo | Resuelto en modelo de datos: regla R-09 + campo `horario_laboral` en perfil |
| RR-007 | Baja adopción por fricción alta en entrada de datos | Alto | Creación rápida (≤10 seg) como funcionalidad P1; validar en criterios de aceptación |
| RR-008 | Tareas sin fecha límite degradan la priorización | Medio | Indicar en UI que tareas sin fecha no se priorizan automáticamente |
| RR-010 | Fórmula de score produce rankings contraintuitivos | Medio | Validar pesos de la fórmula con el ejecutivo antes de implementar |
| RR-011 | Zona horaria incorrecta desincroniza todo el sistema | Alto | Onboarding obligatorio de zona horaria; detectar automáticamente del dispositivo |

### Diferidos a la fase de diseño técnico

| ID | Riesgo | Por qué se difiere |
|----|--------|--------------------|
| RR-002 | Dependencia de APIs externas (Google Calendar) | Decisión de arquitectura: adaptadores desacoplados |
| RR-003 | Costo o latencia del LLM en uso real | Decisión de stack: benchmark de costo en selección del modelo |
| RR-009 | Duplicación de eventos Google Calendar vs manual | Solución técnica: deduplicación por `id_externo` (regla R-06) |

---

## 5. Decisiones Funcionales Clave

> Las 5 decisiones que dan forma a este MVP. Todas vigentes y congeladas.

| ID | Decisión | Fecha | Impacto |
|----|---------|-------|---------|
| **DEC-001** | Arrancar con MVP simple, no con sistema completo | 2026-05-08 | Define el horizonte del proyecto: 4 meses, 1 usuario, concepto validable |
| **DEC-002** | 5 módulos en el MVP (calendario, tareas, recordatorios, priorización IA, resumen diario) | 2026-05-08 | Define el perímetro funcional completo |
| **DEC-003** | Especificación funcional elaborada y congelada antes de cualquier decisión técnica | 2026-05-08 | Elimina ambigüedad; protege contra retrabajo de arquitectura |
| **DEC-004** | Modelo de datos funcional: 6 entidades, 50 campos, 24 reglas, 3 campos LLM | 2026-05-08 | Base estable para el diseño del schema técnico |
| **DEC-005** | Google Calendar pasa a integración opcional (sistema funciona sin ella) | 2026-05-08 | El sistema opera sin dependencia de proveedor externo |
| **DEC-006** | Sign-off funcional aprobado; diseño técnico desbloqueado | 2026-05-08 | Cierra la Fase 1 funcional y abre la Fase 1 técnica |

---

## 6. Criterios para Considerar el MVP "Listo"

> El MVP está listo cuando cumple **todos** los criterios P1 y al menos el **80%** de los criterios P2.

### Criterios funcionales P1 — obligatorios

**Calendario**
- [ ] El ejecutivo puede crear un evento manual con título, fecha y hora en ≤ 30 segundos.
- [ ] El ejecutivo puede ver todos los eventos del día en ≤ 3 segundos tras iniciar sesión.
- [ ] El sistema señala visualmente los conflictos de horario.

**Tareas**
- [ ] El ejecutivo puede crear una tarea con solo el título en ≤ 10 segundos.
- [ ] El ejecutivo puede crear una tarea completa (título + fecha + prioridad) en ≤ 20 segundos.
- [ ] Las tareas se muestran ordenadas por fecha límite + prioridad.
- [ ] Las tareas completadas desaparecen de la vista activa y son recuperables desde el historial.
- [ ] El estado de las tareas persiste entre sesiones sin pérdida de datos.

**Recordatorios**
- [ ] El recordatorio se dispara en el tiempo configurado con ≤ 1 minuto de margen.
- [ ] El ejecutivo puede configurar un recordatorio en ≤ 5 pasos.
- [ ] Los recordatorios no se disparan fuera del horario laboral del ejecutivo.

**Priorización IA**
- [ ] El sistema genera la lista diaria con al menos 3 tareas priorizadas cada mañana.
- [ ] Cada sugerencia incluye una justificación de ≤ 1 frase.
- [ ] El ejecutivo puede rechazar una sugerencia y la lista se actualiza en ≤ 5 segundos.

**Resumen Diario**
- [ ] El resumen se genera automáticamente a la hora configurada sin acción del usuario.
- [ ] El resumen incluye los 4 bloques: agenda, vencidos, top 3 prioridades y sugerencia IA.
- [ ] El resumen es legible en ≤ 2 minutos (máximo 300 palabras).

### Criterios funcionales P2 — deseables (mínimo 80%)

- [ ] La vista semanal del calendario muestra los eventos agrupados por día.
- [ ] Cuando Google Calendar está conectado, los eventos se sincronizan automáticamente sin acción manual.
- [ ] El sistema detecta y no duplica eventos sincronizados desde Google Calendar.
- [ ] La vista de recordatorios del día es visible y ordenada por hora de disparo.
- [ ] La lista de prioridades se recalcula automáticamente al modificar tareas o eventos del día.
- [ ] El ejecutivo puede modificar la hora del resumen diario en ≤ 3 pasos.
- [ ] El historial de tareas completadas es accesible desde la interfaz.

### Criterio de aceptación del sistema completo

> El ejecutivo puede completar el **flujo diario completo** (abrir app → leer resumen → revisar prioridades → crear una tarea → configurar un recordatorio) en menos de **5 minutos**, sin instrucciones ni ayuda externa.

---

## Documentos de referencia del diseño funcional

| Documento | Descripción |
|-----------|-------------|
| `prj-002-mvp-spec.md` | Especificación funcional completa (funcionalidades, user stories, criterios de aceptación) |
| `prj-002-user-flows.md` | Flujos de usuario de los 5 módulos |
| `prj-002-data-model.md` | Modelo de datos funcional (6 entidades, 50 campos, 24 reglas) |
| `prj-002-mvp-signoff.md` | Este documento — cierre oficial del diseño funcional |

---

## Estado al cerrar el Sign-Off

| Ítem | Estado |
|------|--------|
| Alcance funcional | ✅ Congelado |
| Módulos del MVP | ✅ Congelados (5 módulos, 29 funcionalidades) |
| Exclusiones | ✅ Confirmadas (14 exclusiones) |
| Flujos de usuario | ✅ Mapeados (5 flujos) |
| Entidades y modelo de datos | ✅ Definidos (6 entidades, 50 campos, 24 reglas) |
| Criterios de aceptación | ✅ Definidos (20 criterios P1/P2 + 1 criterio global) |
| Riesgos funcionales | ✅ Identificados y categorizados (RR-001 a RR-012) |
| Decisiones clave | ✅ Registradas (DEC-001 a DEC-006) |
| **Diseño técnico** | **⏳ Siguiente paso** |

---

*Aprobado: 2026-05-08 — Documento CONGELADO*
