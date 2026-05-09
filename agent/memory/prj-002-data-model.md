# PRJ-002 — Modelo de Datos Funcional del MVP
## Asistente IA de Agenda Ejecutiva

> Sin decisiones técnicas. Sin base de datos concreta. Sin stack.
> Foco: qué datos existen, qué forma tienen, cómo se relacionan.
> Estado: **BORRADOR** — actualizado 2026-05-08
> Referencias: `prj-002-mvp-spec.md`, `prj-002-user-flows.md`
> Cambio: Google Calendar pasa a integración opcional; eventos manuales son funcionalidad core.

---

## 1. Entidades Principales

El MVP trabaja con **6 entidades**:

| Entidad | Descripción | Creada por |
|---------|-------------|-----------|
| **Ejecutivo** | Perfil único del usuario del sistema | Sistema (1 sola instancia) |
| **Evento** | Reunión o compromiso con fecha y hora | Usuario (core); Google Calendar (opcional) |
| **Tarea** | Acción pendiente que el ejecutivo debe completar | Usuario |
| **Recordatorio** | Alerta asociada a una tarea o evento | Usuario (con ayuda del sistema) |
| **PriorizaciónDiaria** | Ranking IA de tareas para un día específico | Sistema (IA) |
| **ResumenDiario** | Briefing ejecutivo generado cada mañana | Sistema (IA) |

---

## 2. Campos de Cada Entidad

### 2.1 Ejecutivo

> Una sola instancia. Representa el perfil y configuración del usuario.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | texto | sí | Nombre del ejecutivo para personalizar el sistema |
| `zona_horaria` | texto | sí | Zona horaria del ejecutivo (ej. `America/Mexico_City`) |
| `horario_laboral_inicio` | hora | sí | Hora de inicio de la jornada (default: 08:00) |
| `horario_laboral_fin` | hora | sí | Hora de fin de la jornada (default: 19:00) |
| `dias_laborables` | lista | sí | Días activos (default: lunes a viernes) |
| `hora_resumen_diario` | hora | sí | Hora de generación del resumen (default: 07:30) |
| `google_calendar_conectado` | booleano | no | Si hay una cuenta de Google Calendar vinculada |

---

### 2.2 Evento

> Representa una reunión, compromiso o bloque de tiempo en la agenda.
> **Los eventos manuales son la funcionalidad core.** La sincronización con Google Calendar es una capa opcional sobre esta entidad.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | identificador | sí | Identificador único interno |
| `titulo` | texto | sí | Nombre del evento |
| `fecha` | fecha | sí | Día en que ocurre el evento |
| `hora_inicio` | hora | sí | Hora de inicio |
| `hora_fin` | hora | sí | Hora de fin |
| `descripcion` | texto | no | Notas o contexto del evento |
| `origen` | enumerado | sí | `manual` \| `google_calendar` — default: `manual` |
| `proveedor_externo` | enumerado | no | `google_calendar` \| null — nulo si el evento es manual |
| `id_externo` | texto | no | ID del evento en el proveedor externo; nulo si origen es `manual` |
| `sincronizado` | booleano | sí | `false` si es manual; `true` si fue importado desde un proveedor externo |
| `conflicto_detectado` | booleano | calculado | `true` si se solapa con otro evento del mismo día |
| `estado` | enumerado | sí | `activo` o `cancelado` |
| `fecha_creacion` | fecha-hora | sí | Cuándo fue creado o importado en el sistema |

---

### 2.3 Tarea

> Acción concreta que el ejecutivo debe completar. Núcleo del sistema.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | identificador | sí | Identificador único interno |
| `titulo` | texto | sí | Descripción corta de la acción (único campo obligatorio al crear) |
| `descripcion` | texto | no | Contexto o detalle adicional |
| `fecha_limite` | fecha | no | Cuándo debe completarse (puede ser nulo) |
| `prioridad_manual` | enumerado | no | `P1` / `P2` / `P3` / `P4` (default: `P3`) |
| `estado` | enumerado | sí | `pendiente` o `completada` |
| `fecha_creacion` | fecha-hora | sí | Cuándo fue creada |
| `fecha_completada` | fecha-hora | no | Cuándo fue marcada como completada (nulo si pendiente) |

---

### 2.4 Recordatorio

> Alerta temporal vinculada a una tarea o a un evento manual.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | identificador | sí | Identificador único interno |
| `entidad_tipo` | enumerado | sí | `tarea` o `evento` |
| `entidad_id` | identificador | sí | ID de la tarea o evento al que está vinculado |
| `antelacion_tipo` | enumerado | sí | `15min` / `30min` / `1h` / `3h` / `1dia` / `personalizado` |
| `fecha_hora_disparo` | fecha-hora | sí | Momento exacto en que debe activarse la alerta (calculado o ingresado) |
| `origen` | enumerado | sí | `usuario` (configurado manualmente) o `sugerido` (propuesto por el sistema, pendiente de confirmar) |
| `estado` | enumerado | sí | `activo` / `disparado` / `cancelado` |

---

### 2.5 PriorizaciónDiaria

> Resultado del cálculo IA de qué tareas atender ese día. Una instancia por día.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | identificador | sí | Identificador único interno |
| `fecha` | fecha | sí | Día al que corresponde este ranking |
| `tareas_rankeadas` | lista ordenada | sí | IDs de tareas en orden de prioridad, máximo 5 |
| `scores` | mapa | sí | Score numérico calculado por tarea (para uso interno del sistema) |
| `justificaciones` | mapa | sí | Frase de justificación por cada tarea rankeada |
| `tareas_rechazadas_hoy` | lista | no | IDs de tareas que el ejecutivo rechazó del ranking ese día |
| `fecha_generacion` | fecha-hora | sí | Cuándo se generó por primera vez |
| `fecha_ultimo_recalculo` | fecha-hora | no | Cuándo se recalculó por última vez (nulo si no hubo recálculo) |
| `estado` | enumerado | sí | `vigente` / `recalculando` / `sin_tareas` |

---

### 2.6 ResumenDiario

> Briefing ejecutivo generado automáticamente cada mañana. Una instancia por día.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | identificador | sí | Identificador único interno |
| `fecha` | fecha | sí | Día al que corresponde el resumen |
| `hora_generacion` | fecha-hora | sí | Momento exacto en que fue generado |
| `contenido_completo` | texto | sí | Texto íntegro del briefing (máximo 300 palabras) |
| `eventos_del_dia` | lista | sí | IDs de eventos incluidos en el resumen |
| `tareas_vencidas` | lista | no | IDs de tareas vencidas sin completar incluidas |
| `tareas_prioritarias` | lista | sí | IDs del top 3 de tareas del ranking del día |
| `sugerencia_del_dia` | texto | sí | Frase contextual de la IA para esa jornada |
| `estado` | enumerado | sí | `generado` o `no_generado` |

---

## 3. Relaciones entre Entidades

```
Ejecutivo ─────────────────────────────────────────────────────────────
    │                                                                   │
    │ configura                                                         │ configura
    ▼                                                                   ▼
PriorizaciónDiaria                                               ResumenDiario
    │ referencia (0–N)                                                  │ referencia (0–N)
    ▼                                                                   │
  Tarea ◄──────────────────────────────────────────────────────────────┘
    │ (0–1 recordatorio por tarea en MVP)
    ▼
Recordatorio ◄──── también vinculado a ────► Evento  ◄── (opcional) ── Google Calendar
                                                  ▲                     proveedor externo
                                           creado por                   sincronizado=true
                                           el usuario                   id_externo != null
                                        (core — siempre
                                         disponible)
```

### Tabla de relaciones

| Desde | Hacia | Cardinalidad | Descripción |
|-------|-------|-------------|-------------|
| Tarea | Recordatorio | 0..1 | Una tarea puede tener como máximo un recordatorio en MVP |
| Evento | Recordatorio | 0..N | Un evento puede tener múltiples recordatorios (ej. uno propio + uno de Google) |
| PriorizaciónDiaria | Tarea | 0..5 | El ranking del día referencia hasta 5 tareas |
| ResumenDiario | Evento | 0..N | El resumen incluye los eventos del día |
| ResumenDiario | Tarea | 0..N | El resumen incluye tareas vencidas y top prioridades |
| ResumenDiario | PriorizaciónDiaria | 1..1 | El resumen usa el ranking del mismo día |
| Ejecutivo | PriorizaciónDiaria | 1 por día | Una priorización diaria por ejecutivo por día |
| Ejecutivo | ResumenDiario | 1 por día | Un resumen diario por ejecutivo por día |

---

## 4. Google Calendar como Proveedor Externo Opcional

> Google Calendar es una **integración opcional**. El sistema funciona completamente sin ella.
> El calendario interno del sistema es la fuente primaria de eventos.

### 4.1 Datos que Provee Google Calendar (cuando está conectado)

| Dato | Campo en entidad Evento | Observación |
|------|------------------------|-------------|
| Título del evento | `titulo` | Importado tal cual |
| Fecha | `fecha` | Convertida a la zona horaria del ejecutivo |
| Hora de inicio | `hora_inicio` | Convertida a la zona horaria del ejecutivo |
| Hora de fin | `hora_fin` | Convertida a la zona horaria del ejecutivo |
| Descripción | `descripcion` | Importada si existe |
| ID único de Google | `id_externo` | Guardado para evitar duplicados en re-sincronizaciones |
| Recordatorios del evento | Nuevo `Recordatorio` con `origen: sugerido` | El sistema los muestra pero no los duplica si ya existen |

**Campos fijados en eventos de Google Calendar**: `origen: google_calendar`, `proveedor_externo: google_calendar`, `sincronizado: true`.

**Regla de deduplicación**: si un evento ya existe en el sistema con el mismo `id_externo`, se actualiza en lugar de crear uno nuevo. (Ver R-06)

**Datos que Google Calendar NO provee** (el sistema los calcula):
- `conflicto_detectado` — el sistema lo calcula al comparar horarios de todos los eventos del día
- `estado` — el sistema lo infiere: si el evento fue cancelado en GCal, se marca `cancelado`

### 4.2 Comportamiento sin Google Calendar conectado

- El módulo de Calendario opera completamente con eventos manuales.
- No hay degradación funcional: el ejecutivo crea, edita y elimina eventos sin restricción.
- La priorización IA usa los eventos manuales como indicador de carga del día.
- El resumen diario incluye únicamente los eventos manuales.
- La sección de Configuración muestra el estado de la integración y permite conectarla en cualquier momento.

---

## 5. Datos que Introduce el Usuario

| Entidad | Campos introducidos por el usuario |
|---------|-----------------------------------|
| **Ejecutivo** | nombre, zona_horaria, horario_laboral_inicio, horario_laboral_fin, dias_laborables, hora_resumen_diario |
| **Tarea** | titulo (obligatorio), descripcion, fecha_limite, prioridad_manual |
| **Evento (manual)** | titulo, fecha, hora_inicio, hora_fin, descripcion |
| **Recordatorio** | antelacion_tipo (o fecha_hora_disparo si es personalizado) |
| **PriorizaciónDiaria** | tareas_rechazadas_hoy (el ejecutivo rechaza sugerencias) |

**El usuario nunca introduce directamente**: scores de prioridad, justificaciones, contenido del resumen, id_externo, fechas de creación/completado, conflicto_detectado.

---

## 6. Datos que Genera la IA

| Dato | Entidad | Cómo se genera |
|------|---------|---------------|
| `scores` | PriorizaciónDiaria | Fórmula: urgencia (días al deadline) + impacto (prioridad manual) + carga del día (número de eventos) |
| `tareas_rankeadas` | PriorizaciónDiaria | Ordenamiento descendente por score; máximo 5 |
| `justificaciones` | PriorizaciónDiaria | Frase generada por LLM explicando el score de cada tarea en lenguaje natural |
| `sugerencia_del_dia` | ResumenDiario | Frase contextual del LLM basada en la carga del día (reuniones + tareas) |
| `contenido_completo` | ResumenDiario | Texto del briefing generado por LLM con estructura fija (4 secciones) |
| `conflicto_detectado` | Evento | Calculado por el sistema al comparar horarios: `true` si hay solapamiento |
| `fecha_hora_disparo` | Recordatorio | Calculada a partir del campo de la tarea/evento + antelacion_tipo |

**Nota**: `conflicto_detectado` es cálculo determinista (no LLM). `scores` también son cálculo determinista. Solo `justificaciones`, `sugerencia_del_dia` y `contenido_completo` requieren LLM.

---

## 7. Estados Posibles

### Tarea

| Estado | Significado | Transiciones posibles |
|--------|-------------|----------------------|
| `pendiente` | No completada, activa | → `completada` |
| `completada` | Marcada como hecha | → (ninguna en MVP; historial inmutable) |

**Nota**: no hay estado `cancelada` en MVP. Las tareas se eliminan o completan.

---

### Evento

| Estado | Significado | Transiciones posibles |
|--------|-------------|----------------------|
| `activo` | Evento vigente | → `cancelado` |
| `cancelado` | Evento eliminado o cancelado en GCal | → (inmutable) |

---

### Recordatorio

| Estado | Significado | Transiciones posibles |
|--------|-------------|----------------------|
| `activo` | Pendiente de dispararse | → `disparado`, → `cancelado` |
| `disparado` | La alerta ya fue mostrada | → (inmutable) |
| `cancelado` | Desactivado por el usuario o por completar la tarea asociada | → (inmutable) |

---

### PriorizaciónDiaria

| Estado | Significado | Transiciones posibles |
|--------|-------------|----------------------|
| `vigente` | Ranking activo del día | → `recalculando` |
| `recalculando` | El sistema está actualizando el ranking | → `vigente`, → `sin_tareas` |
| `sin_tareas` | No hay tareas con fecha límite o pendientes | → `vigente` (si se agrega una tarea) |

---

### ResumenDiario

| Estado | Significado |
|--------|-------------|
| `generado` | El briefing fue creado a la hora programada |
| `no_generado` | La hora de generación no ha llegado o hubo un error |

---

## 8. Reglas Funcionales del Modelo

Estas reglas definen cómo se comporta el modelo sin importar la tecnología usada.

### Sobre Tareas

| # | Regla |
|---|-------|
| R-01 | Una tarea sin `fecha_limite` no entra en el cálculo de score de urgencia. Se ordena solo por `prioridad_manual`. |
| R-02 | Una tarea `completada` no aparece en ninguna vista activa ni en el ranking de prioridades. |
| R-03 | Al completar una tarea, su recordatorio activo (si tiene) pasa automáticamente a estado `cancelado`. |
| R-04 | Una tarea eliminada borra también su recordatorio asociado. |

### Sobre Eventos

| # | Regla |
|---|-------|
| R-05 | Dos eventos tienen conflicto si comparten el mismo `fecha` y sus intervalos `hora_inicio`/`hora_fin` se solapan. |
| R-06 | Los eventos sincronizados desde Google Calendar se actualizan por `id_externo` y nunca se duplican. Un evento con `sincronizado: true` e `id_externo` igual a uno ya existente se actualiza en lugar de crear uno nuevo. |
| R-07 | Los eventos cancelados no aparecen en la vista de agenda ni en el resumen diario. |
| R-08 | El sistema no modifica los datos de origen en Google Calendar (solo lectura). |

### Sobre Recordatorios

| # | Regla |
|---|-------|
| R-09 | Si la `fecha_hora_disparo` calculada cae fuera del horario laboral del ejecutivo, se desplaza al inicio del siguiente día laboral. |
| R-10 | Un recordatorio en estado `disparado` no puede reactivarse. El ejecutivo debe crear uno nuevo si lo necesita. |
| R-11 | Los recordatorios importados de Google Calendar tienen `origen: sugerido`. El sistema los muestra pero no los duplica si el ejecutivo ya tiene uno activo para el mismo evento. |
| R-12 | En MVP, una tarea puede tener máximo 1 recordatorio activo a la vez. |

### Sobre Priorización IA

| # | Regla |
|---|-------|
| R-13 | El score de prioridad se calcula con tres factores: urgencia + impacto + carga del día. |
| R-14 | Urgencia = inverso de los días al deadline (0 días = score máximo; sin deadline = score neutro). |
| R-15 | Impacto = mapeo de `prioridad_manual` (P1=4, P2=3, P3=2, P4=1). |
| R-16 | Carga del día = penalización proporcional al número de eventos del calendario ese día. |
| R-17 | Una tarea rechazada hoy se excluye del ranking de hoy pero vuelve automáticamente mañana. |
| R-18 | El ranking muestra máximo 5 tareas. Si hay menos de 5 pendientes con fecha, se completa con tareas sin fecha ordenadas por `prioridad_manual`. |
| R-19 | El recálculo del ranking no interrumpe al ejecutivo. La lista actualizada es visible la próxima vez que la consulta. |

### Sobre Resumen Diario

| # | Regla |
|---|-------|
| R-20 | El resumen se genera una vez por día a la `hora_resumen_diario` del ejecutivo. |
| R-21 | Si no hay eventos, la sección de agenda dice "No tienes reuniones agendadas hoy." |
| R-22 | Si no hay tareas vencidas sin completar, la sección "Pendiente sin resolver" se omite del resumen. |
| R-23 | El contenido del resumen no supera 300 palabras. |
| R-24 | Al pulsar sobre un ítem del resumen, el sistema navega al elemento correspondiente (tarea o evento). |

### Sobre Google Calendar (integración opcional)

| # | Regla |
|---|-------|
| R-25 | El sistema debe permitir uso completo sin conectar Google Calendar. Ninguna funcionalidad core queda bloqueada si la integración está desconectada. |
| R-26 | El ejecutivo puede conectar o desconectar Google Calendar en cualquier momento desde Configuración. Al desconectar, los eventos previamente sincronizados se conservan con `sincronizado: true` pero no reciben más actualizaciones. |
| R-27 | La pérdida de conexión con Google Calendar no interrumpe la operación del sistema. Los eventos manuales y los ya sincronizados permanecen accesibles. |

---

## 9. Riesgos del Modelo de Datos

| ID | Riesgo | Severidad | Probabilidad | Mitigación |
|----|--------|-----------|-------------|------------|
| RR-008 | Muchas tareas sin `fecha_limite` → priorización IA tiene pocos datos para trabajar correctamente | Medio | Alta | Mostrar en UI que las tareas sin fecha no se priorizan automáticamente; incentivar al ejecutivo a poner fechas |
| RR-009 | Eventos duplicados entre Google Calendar y creación manual si el ejecutivo no sabe qué hay importado | Bajo | Media | Mostrar claramente el origen de cada evento (`manual` vs `google_calendar`); deduplicar por `id_externo` |
| RR-010 | La fórmula de score (urgencia + impacto + carga) puede producir rankings contraintuitivos en ciertos contextos | Medio | Media | Definir y documentar los pesos de la fórmula antes de implementar; validar con casos reales del ejecutivo |
| RR-011 | Zona horaria incorrecta en el perfil del ejecutivo → recordatorios y resumen diario llegan en horarios equivocados | Alto | Baja | Solicitar zona horaria en el onboarding inicial; mostrarla visiblemente en el perfil para facilitar corrección |
| RR-012 | Pérdida del estado del ranking diario si el sistema reinicia o falla antes de guardarlo | Bajo | Baja | El ranking puede recalcularse desde las tareas y eventos existentes sin pérdida funcional; no requiere persistencia crítica |
| RR-013 | Dependencia excesiva del proveedor externo (Google Calendar) hace que el sistema sea inoperable si la integración falla | Alto | Baja | Eventos manuales como funcionalidad core; Google Calendar como capa opcional sobre ellos; el sistema opera íntegramente sin conexión externa |

> Ver detalle completo en `risks_log.md` — RR-008 a RR-013.

---

---

## 10. Arquitectura Funcional — Capas del Calendario

> Esta sección deja explícito el modelo mental de cómo se organizan los datos del calendario.

```
┌─────────────────────────────────────────────────────┐
│  CAPA 1 — CALENDARIO INTERNO (FUENTE PRIMARIA)       │
│  · El sistema gestiona sus propios eventos           │
│  · Los eventos manuales son el caso de uso principal │
│  · Siempre disponible, sin dependencias externas     │
└─────────────────────────────────────────────────────┘
                          │
                          │  (opcional, activado por el ejecutivo)
                          ▼
┌─────────────────────────────────────────────────────┐
│  CAPA 2 — PROVEEDOR EXTERNO (GOOGLE CALENDAR)        │
│  · Solo lectura — el sistema nunca escribe en GCal   │
│  · Sincronización periódica → crea/actualiza Eventos │
│    en la Capa 1 con origen: google_calendar          │
│  · Si la conexión falla → solo afecta a la sync;     │
│    los eventos ya importados y los manuales persisten │
└─────────────────────────────────────────────────────┘
```

**Principio**: la Capa 1 es independiente. La Capa 2 la enriquece, nunca la reemplaza.

---

## Resumen del Modelo

| Entidad | Campos | Fuente principal |
|---------|--------|------------------|
| Ejecutivo | 7 | Usuario (onboarding) |
| Evento | 13 | Usuario (core); Google Calendar (opcional) |
| Tarea | 8 | Usuario |
| Recordatorio | 7 | Usuario + sistema (cálculo de hora) |
| PriorizaciónDiaria | 8 | Sistema (IA + cálculo determinista) |
| ResumenDiario | 9 | Sistema (LLM) |
| **Total** | **52 campos** | |

**Campos que requieren LLM**: 3 (`justificaciones`, `sugerencia_del_dia`, `contenido_completo`)  
**Campos calculados deterministas**: 4 (`conflicto_detectado`, `scores`, `fecha_hora_disparo`, `tareas_rankeadas`)  
**Campos introducidos por el usuario**: 15  
**Campos del sistema (metadatos)**: 28

---

*Última actualización: 2026-05-08 — Versión inicial*
