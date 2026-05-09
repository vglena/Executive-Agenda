# PRJ-002 — Especificación Funcional del MVP
## Asistente IA de Agenda Ejecutiva

> Documento de referencia funcional. Sin decisiones técnicas.
> Estado: **CONGELADO** — actualizado 2026-05-08
> Aprobado por: usuario
> Decisión: DEC-002, DEC-003, DEC-005

---

## 1. Alcance Funcional del MVP

El MVP es un **asistente inteligente de agenda personal** para un único ejecutivo.

Su propósito es eliminar la dispersión cognitiva diaria: el ejecutivo no tiene que pensar en qué revisar, qué atender primero ni qué tiene olvidado. El sistema lo hace por él.

| Atributo | Valor |
|----------|-------|
| **Usuarios** | 1 (ejecutivo único) |
| **Tipo de acceso** | Personal, sin roles ni permisos |
| **Módulos** | 5 (calendario, tareas, recordatorios, priorización IA, resumen diario) |
| **Interfaz** | Consulta conversacional + vista estructurada |
| **Fuente externa de datos** | Google Calendar — **integración opcional** (el sistema opera sin ella) |
| **Operación esperada** | Uso diario como herramienta de trabajo principal |

**Premisa central**: el sistema no reemplaza la agenda del ejecutivo — la centraliza y la hace inteligente.

---

## 2. Funcionalidades Incluidas

### 2.1 Calendario

| Funcionalidad | Descripción |
|--------------|-------------|
| Vista diaria | Todos los eventos del día en una sola pantalla, ordenados cronológicamente |
| Vista semanal | Panorama de la semana con eventos agrupados por día |
| Crear evento (manual) | Título, fecha, hora inicio/fin, descripción opcional, recordatorio asociable — **funcionalidad core, siempre disponible** |
| Editar evento | Modificar cualquier campo de un evento existente |
| Eliminar evento | Borrar un evento con confirmación |
| Sincronización Google Calendar | Integración **opcional**: cuando está conectada, importa automáticamente los eventos del ejecutivo (solo lectura). El sistema funciona completamente sin ella. |
| Conectar/desconectar Google Calendar | El ejecutivo puede activar o desactivar la integración en cualquier momento desde Configuración |
| Detección de conflictos | El sistema identifica y señala visualmente solapamientos de horario (aplica a eventos manuales y sincronizados) |

### 2.2 Tareas

| Funcionalidad | Descripción |
|--------------|-------------|
| Crear tarea | Título (obligatorio), descripción, fecha límite, prioridad manual (P1–P4), estado inicial |
| Editar tarea | Modificar cualquier campo de una tarea existente |
| Eliminar tarea | Borrar tarea con confirmación |
| Completar tarea | Marcar como completada; desaparece de la vista activa |
| Vista de tareas del día | Tareas con fecha límite = hoy, ordenadas por prioridad |
| Vista de tareas pendientes | Todas las tareas no completadas, ordenadas por fecha límite + prioridad |
| Recuperar tareas completadas | Acceso al historial de tareas completadas |

### 2.3 Recordatorios

| Funcionalidad | Descripción |
|--------------|-------------|
| Crear recordatorio | Asociable a una tarea o evento, con tiempo configurable antes del vencimiento |
| Opciones de tiempo | 15 min, 30 min, 1 hora, 3 horas, 1 día antes, hora personalizada |
| Notificación | Alerta in-app en la interfaz del sistema |
| Vista de recordatorios del día | Lista de todas las alertas programadas para la jornada actual |
| Desactivar recordatorio | El ejecutivo puede cancelar un recordatorio sin borrar la tarea/evento |

### 2.4 Priorización IA

| Funcionalidad | Descripción |
|--------------|-------------|
| Lista de prioridades diaria | Generada cada mañana con las tareas ordenadas por prioridad calculada |
| Score de prioridad | Calculado con: urgencia (días hasta deadline), impacto declarado (prioridad manual), carga del día (eventos en el calendario) |
| Justificación por tarea | Cada sugerencia incluye una frase explicando por qué fue priorizada |
| Rechazo de sugerencia | El ejecutivo puede rechazar una priorización; el sistema la excluye y recalcula |
| Recálculo automático | La lista se recalcula si se agregan o modifican tareas o eventos ese día |

### 2.5 Resumen Diario

| Funcionalidad | Descripción |
|--------------|-------------|
| Generación automática | El sistema genera el resumen a una hora configurable (default: 07:30) |
| Contenido del resumen | Eventos del día · Tareas vencidas sin completar · Top 3 tareas prioritarias del día · Sugerencia IA del día |
| Formato | Texto conciso tipo briefing ejecutivo, máximo 300 palabras |
| Accesibilidad | Visible en la vista principal del sistema al iniciar sesión |
| Configuración de hora | El ejecutivo puede cambiar la hora de generación desde la interfaz |

---

## 3. Funcionalidades Excluidas del MVP

> Estas funcionalidades están explícitamente fuera del MVP v1. Son candidatas para versiones posteriores.

| Funcionalidad | Motivo de exclusión |
|--------------|-------------------|
| Multi-usuario / colaboración | Complejidad innecesaria para validar el concepto con 1 persona |
| Compartir agenda con terceros | Fuera del alcance de usuario único |
| App móvil nativa (iOS/Android) | Incrementa tiempo y costo de desarrollo significativamente |
| Integración con email (lectura/envío) | Aumenta scope y dependencias; evaluar en v2 |
| Integración con Slack / Teams / WhatsApp | Integraciones de mensajería fuera del alcance v1 |
| Gestión de proyectos / sprints | El MVP maneja tareas individuales, no proyectos |
| Análisis histórico / reportes de productividad | Requiere datos acumulados; útil post-MVP |
| Subtareas y checklists | Complejidad de modelo de datos innecesaria para v1 |
| Adjuntos en tareas / notas extendidas | Fuera del alcance funcional del asistente v1 |
| Gestión de contactos | No es un CRM; fuera del alcance |
| Integración con Outlook / iCloud Calendar | Solo Google Calendar en v1; ampliar en v2 |
| Facturación / time tracking | Fuera del propósito del sistema |
| Videollamadas integradas | Fuera del alcance; el ejecutivo usa su herramienta actual |
| Configuración de múltiples calendarios | Un calendario por usuario en v1 |

---

## 4. User Stories

### Módulo: Calendario

| ID | Historia |
|----|---------|
| US-CAL-01 | Como ejecutivo, quiero ver todos mis eventos del día en una sola vista, para planificar mi tiempo sin abrir múltiples apps. |
| US-CAL-02 | Como ejecutivo, quiero crear un evento con título, fecha y hora, para registrar reuniones directamente en el sistema. |
| US-CAL-03 | Como ejecutivo, quiero que mis eventos de Google Calendar se importen automáticamente, para no tener que duplicar entradas. |
| US-CAL-04 | Como ejecutivo, quiero que el sistema me avise visualmente cuando tengo conflictos de horario, para reorganizar mi agenda antes de que sea un problema. |

### Módulo: Tareas

| ID | Historia |
|----|---------|
| US-TAR-01 | Como ejecutivo, quiero crear una tarea con título, fecha límite y prioridad, para registrar lo que debo hacer sin perder el contexto. |
| US-TAR-02 | Como ejecutivo, quiero ver mis tareas del día ordenadas por urgencia y prioridad, para saber de un vistazo qué debo atender. |
| US-TAR-03 | Como ejecutivo, quiero marcar una tarea como completada, para llevar el control de mi avance diario. |
| US-TAR-04 | Como ejecutivo, quiero editar o eliminar una tarea existente, para mantener mi lista actualizada conforme cambia el día. |

### Módulo: Recordatorios

| ID | Historia |
|----|---------|
| US-REC-01 | Como ejecutivo, quiero recibir una alerta antes de una reunión o vencimiento de tarea, para no perder ningún compromiso por olvido. |
| US-REC-02 | Como ejecutivo, quiero configurar con cuánta anticipación quiero ser recordado, para adaptar las alertas a mi ritmo de trabajo. |
| US-REC-03 | Como ejecutivo, quiero ver los recordatorios activos del día, para saber qué alertas tengo programadas y cuándo. |

### Módulo: Priorización IA

| ID | Historia |
|----|---------|
| US-PRI-01 | Como ejecutivo, quiero que el sistema me diga qué tarea debo atender primero hoy, para no gastar energía decidiendo por dónde empezar. |
| US-PRI-02 | Como ejecutivo, quiero entender por qué el sistema prioriza una tarea sobre otra, para poder confiar en la sugerencia y no actuar a ciegas. |
| US-PRI-03 | Como ejecutivo, quiero poder rechazar la priorización sugerida y que el sistema recalcule, para mantener el control final sobre mi agenda. |

### Módulo: Resumen Diario

| ID | Historia |
|----|---------|
| US-RES-01 | Como ejecutivo, quiero recibir cada mañana un resumen con mi agenda, tareas pendientes y prioridades del día, para empezar la jornada orientado en menos de 2 minutos. |
| US-RES-02 | Como ejecutivo, quiero configurar a qué hora recibo el resumen diario, para que encaje con mi rutina de mañana. |
| US-RES-03 | Como ejecutivo, quiero que el resumen sea breve y escaneable, para no tener que leer párrafos largos antes de empezar el día. |

---

## 5. Tareas Fase 1 — Actualizadas

> Estado al 2026-05-08. Máximo 6 tareas.

| # | Tarea | Prioridad | Fecha límite | Estado |
|---|-------|-----------|-------------|--------|
| 1 | Definir requisitos del MVP (funcionalidades v1) | P1 | 2026-05-08 | ✅ completada |
| 2 | Elaborar especificación funcional del MVP (este documento) | P1 | 2026-05-08 | ✅ completada |
| 3 | Mapear flujos de usuario principales (5 módulos) | P1 | 2026-05-08 | ✅ completada |
| 4 | Definir modelo de datos funcional (entidades y relaciones, sin decisiones técnicas) | P1 | 2026-05-08 | ✅ completada |
| 5 | Validar especificación funcional con el usuario (sign-off) | P1 | 2026-05-22 | pendiente |
| 6 | Diseñar arquitectura técnica (stack, LLM, APIs, DB) | P1 | 2026-05-29 | pendiente |

---

## 6. Riesgos Funcionales

| ID | Riesgo | Severidad | Probabilidad |
|----|--------|-----------|-------------|
| RR-004 | La priorización IA entrega sugerencias irrelevantes al inicio por falta de historial del ejecutivo | Medio | Alta |
| RR-005 | El resumen diario es percibido como genérico o de poco valor si no captura bien el contexto del ejecutivo | Medio | Media |
| RR-006 | Los recordatorios llegan en momentos inapropiados si no se modela el horario laboral real del ejecutivo | Bajo | Media |
| RR-007 | El ejecutivo no adopta el hábito de usar el sistema si la fricción de entrada de datos es alta | Alto | Media |

> Ver detalle completo en `risks_log.md` — RR-004 a RR-007.

---

## 7. Criterios de Aceptación

### Calendario

- [ ] El ejecutivo puede ver todos sus eventos del día en ≤ 3 segundos tras iniciar sesión.
- [ ] El ejecutivo puede crear un evento con título, fecha y hora en ≤ 30 segundos.
- [ ] Cuando Google Calendar está conectado, los eventos del ejecutivo aparecen en el sistema sin acción manual (sincronización automática periódica).
- [ ] El sistema señala visualmente los conflictos de horario en la vista de agenda.

### Tareas

- [ ] El ejecutivo puede crear una tarea completa (título + fecha + prioridad) en ≤ 20 segundos.
- [ ] Las tareas se muestran ordenadas por fecha límite + prioridad en la vista principal.
- [ ] Las tareas completadas desaparecen de la vista activa pero son recuperables desde el historial.
- [ ] El estado de las tareas persiste entre sesiones sin pérdida de datos.

### Recordatorios

- [ ] El recordatorio se dispara en el tiempo configurado con ≤ 1 minuto de margen.
- [ ] El ejecutivo puede configurar un recordatorio en ≤ 5 pasos desde cualquier tarea o evento.
- [ ] La vista del día muestra todos los recordatorios activos de la jornada de forma visible.

### Priorización IA

- [ ] El sistema genera una lista diaria con al menos 3 tareas priorizadas cada mañana.
- [ ] Cada sugerencia incluye una justificación de ≤ 1 frase.
- [ ] El ejecutivo puede rechazar una sugerencia y la lista se actualiza en ≤ 5 segundos.
- [ ] La lista de prioridades se recalcula automáticamente si cambian las tareas o la agenda ese día.

### Resumen Diario

- [ ] El resumen se genera automáticamente a la hora configurada (default 07:30) sin acción del usuario.
- [ ] El resumen incluye: eventos del día, tareas vencidas sin completar, top 3 tareas prioritarias y sugerencia IA del día.
- [ ] El resumen es legible en ≤ 2 minutos (máximo 300 palabras).
- [ ] El ejecutivo puede modificar la hora de generación desde la interfaz en ≤ 3 pasos.

---

*Última actualización: 2026-05-08 — Versión inicial, estado CONGELADO*
