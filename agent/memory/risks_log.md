# Risks Log

> Registro de todos los riesgos identificados en proyectos activos y pasados.
> Actualizar en cada revisión semanal o cuando se detecta un nuevo riesgo.

---

## Instrucciones de Uso

- Registrar riesgos desde el inicio del proyecto
- Actualizar estado regularmente (no eliminar riesgos resueltos — marcarlos)
- Los riesgos materializados deben incluir impacto real documentado
- Usar `ID` del riesgo para referencias cruzadas con proyectos y decisiones

---

## Riesgos Activos

### [RR-001] — Scope Creep del MVP
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: El alcance del MVP puede expandirse durante el desarrollo a medida que el usuario identifica nuevas funcionalidades deseables, comprometiendo la fecha de entrega.
- **Severidad**: Alto
- **Probabilidad**: Media
- **Impacto potencial**: Retraso en la entrega del MVP, incremento del esfuerzo de desarrollo y pérdida del foco inicial.
- **Tarea relacionada**: Validar alcance del MVP con el usuario (F1)
- **Plan de mitigación**:
  - [x] Documentar y congelar el alcance del MVP — usuario — 2026-05-08 (**HECHO**)
  - [x] Especificación funcional elaborada y congelada — 2026-05-08 (**HECHO**)
  - [ ] Crear backlog separado para funcionalidades post-MVP — planning_agent — 2026-05-22
- **Estado**: En seguimiento
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-002] — Dependencia de APIs Externas
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Las integraciones con Google Calendar, email u otras APIs externas pueden sufrir cambios, limitaciones de cuota o interrupciones durante el desarrollo.
- **Severidad**: Medio
- **Probabilidad**: Baja
- **Impacto potencial**: Retraso en Fase 3 (integraciones) o necesidad de rediseño de la capa de integración.
- **Tarea relacionada**: Integrar fuentes externas (F3)
- **Plan de mitigación**:
  - [x] Diseñar capa de integración con adaptadores desacoplados desde Fase 1 — planning_agent — 2026-05-29
  - [ ] Evaluar APIs alternativas como fallback durante el diseño — usuario — 2026-05-22
  - [x] F3 activada con F3-01/F3-02 específicamente para Google Calendar — 2026-05-09
  - [x] Google Calendar desacoplado como integración opcional — sistema funciona 100% sin ella — 2026-05-09 (**F3 completada**)
- **Estado**: Resuelto
- **Fecha resolución**: 2026-05-09
- **Impacto real**: Ninguno. Google Calendar integrado como capa opcional (F3-01/F3-02). El sistema opera íntegramente sin conexión externa. Arquitectura de adaptadores validada.

### [RR-003] — Costo o Latencia del LLM en Uso Real
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: El modelo de lenguaje seleccionado puede tener costos operativos o latencias mayores a lo esperado en uso cotidiano real, afectando la viabilidad del sistema.
- **Severidad**: Medio
- **Probabilidad**: Media
- **Impacto potencial**: Necesidad de cambiar de modelo, optimizar prompts o rediseñar la arquitectura de inferencia, generando retrabajo.
- **Tarea relacionada**: Diseñar arquitectura técnica (F1)
- **Plan de mitigación**:
  - [ ] Incluir benchmark de costo y latencia en la evaluación del stack — planning_agent — 2026-05-19
  - [ ] Definir presupuesto mensual máximo de inferencia antes de elegir LLM — usuario — 2026-05-19
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-004] — Priorización IA Irrelevante por Falta de Historial
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: El motor de priorización arranca sin historial del ejecutivo. Las primeras sugerencias pueden ser poco relevantes y generar desconfianza en el sistema si no se gestiona la expectativa.
- **Severidad**: Medio
- **Probabilidad**: Alta
- **Impacto potencial**: El ejecutivo deja de usar la priorización IA por percibir que no agrega valor, reduciendo la utilidad del sistema.
- **Tarea relacionada**: Construir lógica de priorización y sugerencias IA (F2)
- **Plan de mitigación**:
  - [ ] Diseñar una fase de calibración inicial donde el ejecutivo ingresa su perfil de trabajo — planning_agent — 2026-05-19
  - [ ] Comunicar explícitamente en la interfaz que la IA mejora con el uso — planning_agent — 2026-07-10
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-005] — Resumen Diario Percibido como Genérico
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: El resumen diario puede no capturar el contexto real del ejecutivo y resultar en un briefing demasiado genérico o predecible, reduciendo su valor percibido.
- **Severidad**: Medio
- **Probabilidad**: Media
- **Impacto potencial**: El ejecutivo deja de leer el resumen, eliminando uno de los módulos de mayor valor del MVP.
- **Tarea relacionada**: Construir lógica de priorización y sugerencias IA (F2)
- **Plan de mitigación**:
  - [ ] Incluir en los criterios de aceptación una prueba de relevancia del resumen con el usuario real — usuario — 2026-07-24
  - [ ] Diseñar el prompt del resumen con contexto dinámico (tareas vencidas, eventos del día, top prioridades) — planning_agent — 2026-05-19
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-006] — Recordatorios en Horarios Inapropiados
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Sin modelar el horario laboral del ejecutivo, los recordatorios pueden dispararse fuera de la jornada de trabajo (noche, fin de semana), generando ruido.
- **Severidad**: Bajo
- **Probabilidad**: Media
- **Impacto potencial**: El ejecutivo desactiva los recordatorios o los ignora, perdiendo el valor de esta funcionalidad.
- **Tarea relacionada**: Definir modelo de datos funcional (F1)
- **Plan de mitigación**:
  - [x] Incluir campo `horario_laboral_inicio` / `horario_laboral_fin` en entidad Ejecutivo — 2026-05-08 (**HECHO en modelo de datos**)
  - [x] Definir regla R-09: recordatorios fuera de horario laboral se desplazan al inicio del siguiente día laboral — 2026-05-08 (**HECHO**)
- **Estado**: En seguimiento
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-007] — Baja Adopción por Alta Fricción de Entrada de Datos
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si crear tareas, eventos o recordatorios requiere demasiados pasos, el ejecutivo puede dejar de alimentar el sistema y el asistente pierde utilidad por falta de datos.
- **Severidad**: Alto
- **Probabilidad**: Media
- **Impacto potencial**: El sistema queda infrautilizado. El MVP no valida el concepto porque el ejecutivo no lo usa con suficiente frecuencia.
- **Tarea relacionada**: Desarrollar interfaz de consulta conversacional (F2)
- **Plan de mitigación**:
  - [ ] Diseñar flujos de creación rápida (quick-add) para tareas y eventos — planning_agent — 2026-05-15
  - [ ] Validar en criterios de aceptación que cada acción core se completa en ≤30 segundos — usuario — 2026-07-24
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-008] — Muchas Tareas sin Fecha Límite Degradan la Priorización IA
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si el ejecutivo crea muchas tareas sin `fecha_limite`, el motor de priorización no puede calcular urgencia y las sugerencias resultan poco precisas.
- **Severidad**: Medio
- **Probabilidad**: Alta
- **Impacto potencial**: El ranking IA pierde relevancia y el ejecutivo deja de usarlo.
- **Tarea relacionada**: Construir lógica de priorización y sugerencias IA (F2)
- **Plan de mitigación**:
  - [ ] Mostrar en UI que las tareas sin fecha no se priorizan automáticamente — planning_agent — 2026-07-10
  - [ ] Incentivar al ejecutivo a poner fecha límite en el formulario (no forzar) — planning_agent — 2026-07-10
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-009] — Duplicación de Eventos entre Google Calendar y Creación Manual
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: El ejecutivo puede crear manualmente un evento que ya fue importado de Google Calendar, generando duplicados visibles en la agenda.
- **Severidad**: Bajo
- **Probabilidad**: Media
- **Impacto potencial**: La vista del calendario muestra información confusa; el ejecutivo pierde confianza en los datos.
- **Tarea relacionada**: Integrar fuentes externas (F3)
- **Plan de mitigación**:
  - [ ] Mostrar el origen de cada evento (`manual` vs `google_calendar`) en la vista del calendario — planning_agent — 2026-07-24
  - [x] Deduplicar por `id_externo` en cada sincronización (regla R-06) — 2026-05-09 (**HECHO en F3-02**)
- **Estado**: Resuelto
- **Fecha resolución**: 2026-05-09
- **Impacto real**: Ninguno. F3-02 implementó deduplicación por `id_externo` + campo `proveedor_externo`. Conflictos resueltos via F3-03.

### [RR-010] — Fórmula de Score Produce Rankings Contraintuitivos
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: La fórmula urgencia + impacto + carga del día puede producir rankings que el ejecutivo percibe como incorrectos en ciertos escenarios (ej. tarea P1 sin deadline vs tarea P3 que vence hoy).
- **Severidad**: Medio
- **Probabilidad**: Media
- **Impacto potencial**: El ejecutivo rechaza sistemáticamente las sugerencias o deja de confiar en la IA.
- **Tarea relacionada**: Construir lógica de priorización y sugerencias IA (F2)
- **Plan de mitigación**:
  - [ ] Documentar y validar con el ejecutivo los pesos de la fórmula antes de implementar — usuario — 2026-05-22
  - [ ] Probar con casos reales del ejecutivo durante el diseño — planning_agent — 2026-05-22
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-011] — Zona Horaria Incorrecta Desincroniza Todo el Sistema
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si la zona horaria del perfil del ejecutivo es incorrecta, los recordatorios, el resumen diario y la importación de Google Calendar llegarán en horarios equivocados.
- **Severidad**: Alto
- **Probabilidad**: Baja
- **Impacto potencial**: El sistema es inutilizable hasta que el usuario detecta y corrige el problema; genera desconfianza inicial.
- **Tarea relacionada**: Definir modelo de datos funcional (F1)
- **Plan de mitigación**:
  - [ ] Solicitar zona horaria explícitamente en el onboarding; mostrarla prominentemente en el perfil — planning_agent — 2026-07-10
  - [ ] Detectar y sugerir zona horaria del dispositivo automáticamente como valor por defecto — planning_agent — 2026-07-10
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-012] — Pérdida del Estado del Ranking Diario ante Fallo del Sistema
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si el sistema falla o reinicia antes de persistir el `PriorizaciónDiaria`, el ranking del día se pierde.
- **Severidad**: Bajo
- **Probabilidad**: Baja
- **Impacto potencial**: Mínimo: el ranking puede recalcularse desde las tareas y eventos existentes sin pérdida de datos críticos.
- **Tarea relacionada**: Testing funcional, carga y seguridad (F3)
- **Plan de mitigación**:
  - [ ] Diseñar el ranking como recalculable en cualquier momento desde los datos base — planning_agent — 2026-05-29
- **Estado**: Aceptado
- **Fecha resolución**: null
- **Impacto real**: null
- **Fecha detectado**: YYYY-MM-DD
- **Proyecto**: [nombre o PRJ-XXX]
- **Detectado por**: [usuario / risk_agent]
- **Descripción**: [qué puede fallar o qué está fallando]
- **Severidad**: [Bajo / Medio / Alto / Crítico]
- **Probabilidad**: [Baja / Media / Alta]
- **Impacto potencial**: [qué ocurriría si se materializa]
- **Tarea relacionada**: [nombre de tarea o null]
- **Plan de mitigación**:
  - [ ] [Acción 1] — [responsable] — [fecha]
  - [ ] [Acción 2] — [responsable] — [fecha]
- **Estado**: [Abierto / En seguimiento / Resuelto / Materializado / Aceptado]
- **Fecha resolución**: [fecha o null]
- **Impacto real** (si se materializó): [descripción]
```

### [RR-013] — Dependencia Excesiva de Proveedor Externo
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si Google Calendar es la única forma de alimentar el calendario del sistema, cualquier fallo de autenticación, cambio en la API de Google o desconexión hace que el módulo de calendario quede inutilizable.
- **Severidad**: Alto
- **Probabilidad**: Baja
- **Impacto potencial**: El ejecutivo no puede ver ni gestionar su agenda, eliminando el valor central del MVP.
- **Tarea relacionada**: Diseñar arquitectura técnica (F1)
- **Plan de mitigación**:
  - [x] Definir eventos manuales como funcionalidad core — 2026-05-08 (**HECHO en spec funcional**)
  - [x] Definir Google Calendar como integración opcional sobre el calendario interno — 2026-05-08 (**HECHO en modelo de datos**)
  - [x] Definir reglas R-25, R-26, R-27 que garantizan operación sin conexión externa — 2026-05-08 (**HECHO**)
  - [x] Validar durante testing que el sistema opera íntegramente sin Google Calendar conectado — 2026-05-09 (**HECHO en F3-06 verify-production.ts bloque F: estado agnóstico**)
- **Estado**: Resuelto
- **Fecha resolución**: 2026-05-09
- **Impacto real**: Ninguno. Sistema validado con y sin Google Calendar conectado (F3-06 bloque F, estado agnóstico). 13/13 suites pasadas sin Google Calendar activo.

### [RR-014] — node-cron Falla Silenciosamente ante Reinicio del Servidor
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si Railway reinicia el servidor, node-cron se detiene. Los recordatorios no se disparan hasta que el servidor vuelve a arrancar y `initScheduler()` se ejecuta.
- **Severidad**: Medio
- **Probabilidad**: Media
- **Impacto potencial**: El ejecutivo no recibe recordatorios durante el tiempo de downtime. Railway auto-restart mitiga el tiempo de inactividad.
- **Tarea relacionada**: Configurar node-cron scheduler (F1)
- **Plan de mitigación**:
  - [x] Llamar `initScheduler()` en el arranque del servidor (Next.js custom server) — 2026-05-09 (**HECHO en server.ts**)
  - [x] Añadir logs explícitos de inicio del cron — 2026-05-09 (**HECHO: `[server] Ready...` + `initScheduler()` on listen**)
- **Estado**: Resuelto
- **Fecha resolución**: 2026-05-09
- **Impacto real**: Ninguno. `server.ts` llama `initScheduler()` después del `.listen()`. Railway auto-restart garantiza reinicio rápido. `/api/health` expone `scheduler.active_jobs` para monitoreo.

### [RR-015] — JWT Secret Débil o Expuesto al Repositorio
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Si `JWT_SECRET` es débil o se sube accidentalmente al repositorio, un atacante puede generar tokens válidos y acceder al sistema del ejecutivo.
- **Severidad**: Alto
- **Probabilidad**: Baja
- **Impacto potencial**: Acceso total al sistema del ejecutivo.
- **Tarea relacionada**: Implementar autenticación JWT (F1)
- **Plan de mitigación**:
  - [ ] Generar `JWT_SECRET` con `openssl rand -base64 32` — dev — 2026-05-19
  - [ ] Añadir `.env` a `.gitignore` desde el commit inicial — dev — 2026-05-12
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-016] — Tokens Google Calendar Expuestos por Cifrado Mal Configurado
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Los tokens OAuth de Google Calendar en DB pueden exponerse si `CALENDAR_ENCRYPTION_KEY` está mal configurada o ausente.
- **Severidad**: Alto
- **Probabilidad**: Baja
- **Impacto potencial**: Acceso no autorizado al calendario del ejecutivo.
- **Tarea relacionada**: Configurar despliegue en Railway + Supabase (F1)
- **Plan de mitigación**:
  - [ ] Cifrar tokens con AES-256-GCM usando `CALENDAR_ENCRYPTION_KEY` de env vars — dev — 2026-05-22
  - [ ] Nunca retornar tokens en respuestas de API — dev — 2026-05-22
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-017] — Cambio de Modelo o Precios en OpenAI
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: OpenAI puede deprecar gpt-4o-mini, modificar precios o cambiar la API, forzando un cambio de proveedor o modelo.
- **Severidad**: Medio
- **Probabilidad**: Baja
- **Impacto potencial**: Necesidad de cambiar de modelo o proveedor LLM; retrabajo si no hay abstracción.
- **Tarea relacionada**: Implementar LLMAdapter (F1)
- **Plan de mitigación**:
  - [ ] Implementar LLMAdapter como interface; OpenAIAdapter como implementación intercambiable — dev — 2026-05-22
  - [ ] Modelo configurable vía `LLM_MODEL` env var — dev — 2026-05-22
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

### [RR-018] — Migraciones Prisma Aplicadas en Producción sin Testear
- **Fecha detectado**: 2026-05-08
- **Proyecto**: PRJ-002 — Asistente IA de Agenda Ejecutiva
- **Detectado por**: risk_agent
- **Descripción**: Aplicar `prisma migrate deploy` en producción sin probar la migración en local puede corromper datos o romper el sistema.
- **Severidad**: Medio
- **Probabilidad**: Media
- **Impacto potencial**: Pérdida de datos o sistema inoperativo hasta revertir la migración.
- **Tarea relacionada**: Definir schema Prisma + seed (F1)
- **Plan de mitigación**:
  - [ ] Siempre ejecutar `prisma migrate dev` en local antes de `migrate deploy` en producción — dev — convención de equipo
  - [ ] Nunca modificar Supabase directamente; todo va por migraciones — dev — convención de equipo
- **Estado**: Abierto
- **Fecha resolución**: null
- **Impacto real**: null

---

## Riesgos Resueltos

*No hay riesgos resueltos aún.*

---

*Última actualización: 2026-05-08 — RR-014 a RR-018 añadidos (riesgos técnicos)*
