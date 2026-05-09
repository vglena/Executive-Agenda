# PRJ-002 — Flujos de Usuario del MVP
## Asistente IA de Agenda Ejecutiva

> Foco: MVP. Simplicidad máxima. Sin decisiones técnicas.
> Estado: **BORRADOR** — actualizado 2026-05-08
> Referencia: `prj-002-mvp-spec.md`
> Cambio: Añadidos Flujo 6 (usuario sin Google Calendar) y Flujo 7 (conectar/desconectar GCal).

---

## FLUJO 1 — Flujo Diario del Ejecutivo

> Cómo el ejecutivo usa el sistema de principio a fin en un día normal.

```
[07:30] Sistema genera el Resumen Diario automáticamente
        │
        ▼
[Ejecutivo abre la app]
        │
        ├── Ve el Resumen Diario en la pantalla principal
        │       · Eventos del día
        │       · Tareas vencidas sin completar
        │       · Top 3 prioridades sugeridas por IA
        │       · Sugerencia del día
        │
        ▼
[Revisa la lista de prioridades IA]
        │
        ├── Acepta sugerencias → comienza su jornada con claridad
        │
        └── Rechaza alguna sugerencia → sistema recalcula y presenta nueva lista
                │
                ▼
[Durante la jornada]
        │
        ├── Recibe recordatorio → ve la alerta in-app → actúa o la descarta
        │
        ├── Surge nueva tarea → usa creación rápida (≤20 seg)
        │       │
        │       └── Sistema recalcula prioridades automáticamente
        │
        ├── Completa una tarea → la marca como completada → desaparece de la vista activa
        │
        └── Revisa el calendario si necesita ver conflictos o próximos eventos
                │
[Final del día]
        │
        └── Vista de tareas pendientes → decide qué posponer o mantener para mañana
```

**Pantalla principal muestra al abrir**:
1. Resumen del día (si es por la mañana) o estado actual (si es después)
2. Top 3 tareas priorizadas por IA
3. Próximo evento del calendario
4. Recordatorios activos del día

---

## FLUJO 2 — Creación Rápida de Tareas

> El ejecutivo puede registrar una tarea en el menor número de pasos posible.

### Caso A: Creación mínima (solo título)

```
Ejecutivo pulsa [+ Tarea] o escribe en el campo rápido
        │
        ▼
Escribe el título de la tarea
        │
        ▼
Pulsa Enter / Confirmar
        │
        ▼
Tarea creada con:
  · Título: el ingresado
  · Fecha límite: sin fecha (aparece en "Sin fecha")
  · Prioridad: P3 (valor por defecto)
  · Estado: pendiente
        │
        ▼
[Opcional] Ejecutivo puede expandir la tarea para agregar:
  · Fecha límite
  · Prioridad (P1–P4)
  · Descripción
  · Recordatorio asociado
```

**Tiempo objetivo**: ≤ 10 segundos para creación mínima.

### Caso B: Creación completa

```
Ejecutivo pulsa [+ Tarea completa]
        │
        ▼
Formulario con campos:
  · Título (obligatorio)          ← foco automático
  · Fecha límite (opcional)       ← selector de fecha
  · Prioridad (opcional)          ← P1 / P2 / P3 / P4 (default: P3)
  · Descripción (opcional)        ← texto libre, breve
  · Recordatorio (opcional)       ← sí/no → si sí, cuándo
        │
        ▼
Ejecutivo pulsa [Guardar]
        │
        ▼
Tarea creada → aparece en la vista correspondiente
  · Si tiene fecha = hoy → aparece en "Tareas del día"
  · Si tiene fecha futura → aparece en "Pendientes"
  · Si no tiene fecha → aparece en "Sin fecha"
        │
        ▼
Sistema recalcula lista de prioridades IA si la tarea tiene fecha límite
```

**Tiempo objetivo**: ≤ 30 segundos para creación completa.

### Reglas del flujo

- El título es el único campo obligatorio; todo lo demás es opcional.
- El foco va directo al campo de título al abrir el formulario.
- El ejecutivo puede salir del formulario sin guardar con un gesto de cancelar.
- No hay confirmación de creación con popup — la tarea aparece directamente en la lista.

---

## FLUJO 3 — Priorización IA

> Cómo el sistema genera y gestiona la lista de prioridades diaria.

### Generación automática (sin acción del ejecutivo)

```
[07:30] Sistema calcula el score de prioridad para cada tarea pendiente
        │
        ▼
Para cada tarea, el sistema evalúa:
  · Urgencia         → días hasta el deadline (menos días = mayor score)
  · Impacto          → prioridad manual asignada por el ejecutivo (P1 > P2 > P3 > P4)
  · Carga del día    → número de eventos en el calendario hoy (más eventos = menos capacidad)
        │
        ▼
Sistema ordena las tareas de mayor a menor score
        │
        ▼
Para cada tarea en el top 5, genera una justificación de 1 frase:
  Ej: "Vence en 2 días y tienes 4 reuniones hoy — atender esta mañana."
        │
        ▼
Lista de prioridades disponible en pantalla principal al abrir la app
```

### Interacción del ejecutivo con la lista

```
Ejecutivo ve la lista de prioridades
        │
        ├── [Acepta] → no hace nada, trabaja según el orden sugerido
        │
        └── [Rechaza una tarea]
                │
                ▼
        Sistema elimina esa tarea del ranking de hoy (no la borra)
                │
                ▼
        Recalcula el ranking con las tareas restantes
                │
                ▼
        Muestra la lista actualizada inmediatamente (≤5 seg)
```

### Recálculo automático durante el día

```
Evento disparador:
  · Se crea una nueva tarea con fecha límite
  · Se modifica la fecha o prioridad de una tarea existente
  · Se agrega o modifica un evento en el calendario del día
        │
        ▼
Sistema recalcula el ranking en background
        │
        ▼
Lista actualizada visible la próxima vez que el ejecutivo la consulta
(sin interrupción activa al ejecutivo — no hay notificación push)
```

### Reglas del flujo

- La lista muestra un máximo de 5 tareas priorizadas (enfoque, no ruido).
- Las tareas rechazadas vuelven a la lista al día siguiente si siguen pendientes.
- Si no hay tareas con fecha, el sistema ordena por prioridad manual.
- Si no hay tareas pendientes, el sistema muestra: "No tienes tareas prioritarias para hoy."

---

## FLUJO 4 — Resumen Diario

> Cómo el sistema genera y presenta el briefing matutino.

### Generación automática

```
[07:30] (hora configurable) Sistema ejecuta la generación del resumen
        │
        ▼
Recopila datos del día actual:
  · Eventos del calendario (manuales + sincronizados con Google Calendar si está conectado)
  · Tareas con fecha límite = hoy
  · Tareas vencidas sin completar (fecha < hoy)
  · Top 3 tareas de la lista de prioridades IA del día
        │
        ▼
Genera el resumen con esta estructura fija:

  ─────────────────────────────────────
  Buenos días. Hoy es [día, fecha].

  📅 TU AGENDA HOY
  [lista de eventos con hora y título]

  ⚠️ PENDIENTE SIN RESOLVER
  [tareas vencidas, si hay alguna — máximo 3]

  ✅ TU FOCO DE HOY
  [top 3 tareas priorizadas con justificación de 1 frase cada una]

  💡 SUGERENCIA DEL DÍA
  [1 frase contextual: ej. "Tienes 3 reuniones seguidas — bloquea 30 min después para procesar."]
  ─────────────────────────────────────

        ▼
Resumen disponible en pantalla principal
```

**Restricciones de contenido**:
- Máximo 300 palabras en total.
- Si no hay eventos: "No tienes reuniones agendadas hoy."
- Si no hay tareas vencidas: omitir la sección "Pendiente sin resolver".
- Si no hay tareas pendientes: "No tienes tareas pendientes para hoy."

### Interacción del ejecutivo

```
Ejecutivo abre la app (mañana)
        │
        └── Ve el resumen directamente en la pantalla principal
                │
                ├── Lo lee (≤2 min) y comienza su jornada
                │
                └── Pulsa en cualquier ítem del resumen → navega a ese elemento
                        Ej: pulsa en una tarea del foco → abre la vista de esa tarea
                            pulsa en un evento → abre la vista del evento
```

### Configuración de hora

```
Ejecutivo va a Configuración
        │
        ▼
Sección: Resumen Diario
        │
        ▼
Campo: "Hora de generación" → selector de hora (default: 07:30)
        │
        ▼
Guarda → nuevo horario activo desde el día siguiente
```

**Tiempo objetivo**: ≤ 3 pasos para cambiar la hora.

---

## FLUJO 5 — Recordatorios Inteligentes

> Cómo el ejecutivo configura recordatorios y cómo el sistema los dispara.

### Crear recordatorio desde una tarea

```
Ejecutivo abre una tarea existente (o está creando una nueva)
        │
        ▼
Pulsa [Agregar recordatorio]
        │
        ▼
Selecciona cuándo quiere ser avisado:
  · 15 minutos antes
  · 30 minutos antes
  · 1 hora antes
  · 3 horas antes
  · 1 día antes
  · Hora personalizada → selector de fecha y hora exacta
        │
        ▼
Confirma → recordatorio guardado y vinculado a la tarea
        │
        ▼
Aparece en "Recordatorios del día" si la fecha es hoy
```

### Crear recordatorio desde un evento del calendario

```
Ejecutivo abre un evento del calendario
        │
        ▼
Pulsa [Agregar recordatorio] (mismo flujo que tarea)
        │
        ▼
[Nota]: los eventos importados de Google Calendar pueden traer sus recordatorios de Google.
El ejecutivo puede agregar un recordatorio adicional en el sistema.
Si Google Calendar no está conectado, este flujo aplica íntegramente a eventos manuales.
```

### Disparo del recordatorio

```
[Hora del recordatorio llega]
        │
        ▼
Sistema muestra alerta in-app:
  ─────────────────────────────
  🔔 Recordatorio
  [Título de la tarea o evento]
  Vence / comienza en [X min / en [hora]]
  ─────────────────────────────
        │
        ├── [Descartar] → alerta desaparece; el recordatorio no vuelve a dispararse
        │
        └── [Ver] → navega directamente a la tarea o evento relacionado
```

### Vista de recordatorios del día

```
Ejecutivo abre la sección "Recordatorios"
        │
        ▼
Ve la lista de todos los recordatorios activos para hoy:
  · Ordenados por hora de disparo
  · Con indicador de si ya se dispararon o están pendientes
  · Con el título del elemento asociado (tarea o evento)
        │
        ├── Pulsa en uno → navega al elemento asociado
        │
        └── Pulsa [Desactivar] → cancela el recordatorio sin borrar la tarea/evento
```

### Comportamiento inteligente

El sistema aplica estas reglas automáticamente sin configuración del ejecutivo:

| Situación | Comportamiento |
|-----------|----------------|
| Tarea creada sin recordatorio, vence hoy | Sistema sugiere (no fuerza) agregar un recordatorio |
| Recordatorio programado fuera del horario laboral | Sistema desplaza al inicio del horario laboral del día siguiente |
| Evento de Google Calendar importado ya tiene recordatorio | Sistema lo muestra pero no duplica |
| Evento manual sin recordatorio de proveedor externo | Se aplica exactamente el mismo flujo de creación de recordatorio |
| Tarea completada con recordatorio activo | Recordatorio se cancela automáticamente |

---

## FLUJO 6 — Usuario sin Google Calendar

> El sistema funciona completamente sin ninguna cuenta de Google conectada.

### Caso normal: ejecutivo nunca conecta Google Calendar

```
Ejecutivo instala el sistema y completa el onboarding
        │
        ▼
Onboarding solicita:
  · Nombre
  · Zona horaria
  · Horario laboral
  · Hora del resumen diario
  · [Opcional] Conectar Google Calendar → ejecutivo omite este paso
        │
        ▼
Sistema queda completamente operativo:
  · Calendario → el ejecutivo crea eventos manualmente (Flujo F2-eventos)
  · Tareas → funciona sin cambios (Flujo F2)
  · Recordatorios → funcionan sin cambios (Flujo F5)
  · Priorización IA → usa eventos manuales como indicador de carga del día
  · Resumen diario → incluye eventos manuales del día
```

### Creación manual de un evento

```
Ejecutivo pulsa [+ Evento] en la vista de calendario
        │
        ▼
Formulario con campos:
  · Título (obligatorio)        ← foco automático
  · Fecha (obligatorio)         ← selector de fecha
  · Hora inicio (obligatorio)   ← selector de hora
  · Hora fin (obligatorio)      ← selector de hora
  · Descripción (opcional)     ← texto libre
  · Recordatorio (opcional)     ← sí/no → si sí, cuándo
        │
        ▼
Ejecutivo pulsa [Guardar]
        │
        ▼
Evento creado con:
  · origen: manual
  · proveedor_externo: null
  · id_externo: null
  · sincronizado: false
        │
        ▼
Evento aparece en la vista del día correspondiente
Sistema recalcula la carga del día para la priorización IA
```

**Tiempo objetivo**: ≤40 segundos para crear un evento completo.

**Comportamiento del sistema si Google Calendar no está conectado**:
- El botón [+ Evento] siempre es visible y funcional.
- No hay mensajes de error ni advertencias relacionados con la ausencia de integración.
- El indicador de estado en Configuración muestra “Google Calendar: no conectado” sin bloquear ninguna pantalla.

---

## FLUJO 7 — Conectar y Desconectar Google Calendar

> El ejecutivo puede activar o desactivar la integración en cualquier momento.
> No es necesario conectarla para usar el sistema.

### Conectar Google Calendar

```
Ejecutivo va a Configuración
        │
        ▼
Sección: Integraciones
Estado actual: “Google Calendar — No conectado”
        │
        ▼
Ejecutivo pulsa [Conectar Google Calendar]
        │
        ▼
Sistema inicia el flujo de autorización con Google
(el ejecutivo autoriza el acceso en la pantalla de Google)
        │
        ▼
[Si autorizado]
  Estado cambia a: “Google Calendar — Conectado”
  Sistema realiza la primera sincronización automática
  Los eventos de GCal aparecen en la agenda con origen: google_calendar
        │
        ▼
[Si rechazado o error]
  Estado permanece: “No conectado”
  Sistema muestra mensaje: “No se pudo conectar. Puedes intentarlo más tarde.”
  El sistema sigue operando normalmente con eventos manuales
```

### Desconectar Google Calendar

```
Ejecutivo va a Configuración → Integraciones
Estado actual: “Google Calendar — Conectado”
        │
        ▼
Ejecutivo pulsa [Desconectar]
        │
        ▼
Sistema muestra confirmación:
  “¿Deseas desconectar Google Calendar?
  Los eventos ya importados se conservarán pero no se actualizarán.”
        │
        ▼
[Confirma]
  Google Calendar queda desconectado
  Los eventos con sincronizado: true se conservan tal como estaban
  No llegan nuevas actualizaciones desde GCal
  El campo google_calendar_conectado del Ejecutivo pasa a false
  El sistema sigue operando normalmente
        │
        ▼
[Cancela]
  No se realiza ningún cambio
```

**Reglas del flujo**:
- Al desconectar, los eventos ya importados **no se eliminan**. Permanecen con `sincronizado: true`.
- Al volver a conectar, la sincronización retoma desde el estado actual de Google Calendar (puede generar actualizaciones sobre eventos existentes).
- La pérdida de conexión (timeout, error de red) se trata como “no conectado temporalmente” — no borra datos.
- El ejecutivo puede reconectar en cualquier momento sin perder ningún dato del sistema.

---

## Resumen de Flujos

| Flujo | Disparador | Actor | Resultado |
|-------|-----------|-------|-----------|
| F1 — Flujo diario | Apertura de la app | Ejecutivo | Jornada organizada en ≤5 min |
| F2 — Creación rápida de tarea | Acción del ejecutivo | Ejecutivo | Tarea registrada en ≤30 seg |
| F3 — Priorización IA | Automático (07:30) + cambios | Sistema | Lista de 5 prioridades con justificación |
| F4 — Resumen diario | Automático (07:30) | Sistema | Briefing de ≤300 palabras listo al despertar |
| F5 — Recordatorios | Configuración del ejecutivo | Ejecutivo + Sistema | Alerta puntual, sin ruido, en horario laboral || F6 — Uso sin Google Calendar | En cualquier momento | Ejecutivo | Sistema 100% operativo con eventos manuales |
| F7 — Conectar/desconectar GCal | Acción en Configuración | Ejecutivo | Integración activada o desactivada en ≤5 pasos |
---

*Última actualización: 2026-05-08 — Añadidos Flujo 6 y Flujo 7; Google Calendar como integración opcional*
