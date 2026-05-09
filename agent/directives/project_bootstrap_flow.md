# Directive: Project Bootstrap Flow

## Objetivo

Orquestar el flujo completo desde que el usuario expresa la intención de crear un proyecto hasta que queda registrado en memoria y sincronizado con ClickUp. Este archivo conecta todos los componentes del sistema en una secuencia determinista.

---

## Diagrama del Flujo

```
Usuario: "Quiero crear un proyecto para..."
         │
         ▼
┌─────────────────────────────────────────────────┐
│  project_request_interpreter.md                 │
│  • Detectar intención                           │
│  • Extraer nombre, objetivo, tipo, deadline     │
│  • Hacer máx. 2 preguntas si falta algo crítico │
│  • Confirmar en 1 frase                         │
└───────────────────┬─────────────────────────────┘
                    │ {nombre, objetivo, tipo, deadline, complejidad}
                    ▼
┌─────────────────────────────────────────────────┐
│  roadmap_generation.md (planning_agent)         │
│  • Evaluar complejidad y duración               │
│  • Dividir en fases                             │
│  • Generar milestones                           │
│  • Generar tareas F1 (detalladas)               │
│  • Generar tareas F2+ (alto nivel)              │
│  • Detectar dependencias y riesgos iniciales    │
│  • Decidir qué tareas van a ClickUp             │
└───────────────────┬─────────────────────────────┘
                    │ {phases, milestones, tasks, risks}
                    ▼
┌─────────────────────────────────────────────────┐
│  new_project_creation.md (project_manager_agent)│
│  • Verificar que no existe duplicado            │
│  • Asignar PRJ-XXX                              │
│  • Validar estructura mínima                    │
│  • Preparar payload completo                    │
└───────────────────┬─────────────────────────────┘
                    │ ProjectInput payload
                    ▼
┌─────────────────────────────────────────────────┐
│  project_creator.md → project_bootstrap.service │
│  (operations_agent)                             │
│  • validateProjectInput()                       │
│  • createInitialTasks() — solo F1 → ClickUp     │
│  • registerProjectMemory()                      │
│  • buildProjectSummary()                        │
│  • bootstrapProject()                           │
└───────────┬──────────────────────┬──────────────┘
            │ ClickUp API          │ Memory blocks
            ▼                      ▼
┌───────────────────┐  ┌───────────────────────────┐
│  ClickUp          │  │  active_projects.md        │
│  • Crea tareas F1 │  │  decisions_log.md          │
│  • Retorna IDs    │  │  risks_log.md              │
└───────────────────┘  └───────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────┐
│  risk_agent                                     │
│  • Registrar riesgos iniciales en risks_log.md  │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  reporting_agent                                │
│  • Generar resumen final para el usuario        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
Usuario recibe resumen del proyecto creado
```

---

## Cuándo se Activa

Esta directive se activa cuando `project_manager_agent` decide iniciar la creación de un proyecto nuevo después de que `project_request_interpreter.md` ha confirmado la intención del usuario.

**Prerequisito:** El usuario ha confirmado (o no ha objetado) el resumen de interpretación.

---

## Responsabilidades por Agente

| Agente | Fase | Qué hace | Qué NO hace |
|--------|------|----------|-------------|
| `project_manager_agent` | Coordinación global | Activa cada componente en orden, gestiona errores, reporta al usuario | No genera tareas, no toca ClickUp |
| `planning_agent` | Roadmap | Genera fases, milestones, tareas, prioridades, dependencias, riesgos iniciales | No registra en memoria, no valida duplicados |
| `operations_agent` | Ejecución | Valida payload, llama `project_bootstrap.service.ts`, persiste memoria | No decide qué tareas crear, no modifica roadmap |
| `risk_agent` | Validación de riesgos | Revisa y registra riesgos detectados por `planning_agent` en `risks_log.md` | No bloquea el flujo, solo registra |
| `reporting_agent` | Resumen final | Genera el mensaje de confirmación estructurado para el usuario | No toma decisiones, no modifica nada |

---

## Inputs del Flujo

| Campo | Origen | Obligatorio |
|-------|--------|-------------|
| Petición natural del usuario | Usuario | Sí |
| `CLICKUP_API_TOKEN` | `.env` | Sí (para sync) |
| `CLICKUP_TEAM_ID` | `.env` | Opcional |
| `clickup_list_id` | Configuración / usuario | Opcional — sin él no hay sync |
| IDs existentes en `active_projects.md` | Memoria | Para generar PRJ-XXX incremental |
| Conteos en `decisions_log.md` y `risks_log.md` | Memoria | Para generar DEC-XXX y RR-XXX |

---

## Proceso Paso a Paso

### Paso 1 — Interpretar la petición `[project_manager_agent]`

Seguir `directives/project_request_interpreter.md`:

1. Detectar intención de creación de proyecto
2. Extraer: nombre, objetivo, tipo, prioridad, deadline, complejidad, áreas
3. Si faltan nombre u objetivo: hacer máximo 1 pregunta por campo
4. Confirmar con el usuario en 1 frase antes de continuar
5. Si el usuario confirma o no objeta: avanzar al Paso 2

**Criterio de avance:** Tener nombre + objetivo + deadline (o TBD).

---

### Paso 2 — Generar roadmap `[planning_agent]`

Seguir `directives/roadmap_generation.md`:

1. Evaluar complejidad, duración estimada y áreas implicadas
2. Seleccionar plantilla de fases según tipo de proyecto
3. Calcular fechas de fase a partir de `start_date` y `target_date`
4. Generar milestones (1 por fase mínimo)
5. Generar tareas F1 (detalladas: nombre, descripción, prioridad, fecha, área)
6. Generar tareas F2+ (solo alto nivel: nombre, fase, prioridad estimada)
7. Marcar cada tarea con `send_to_clickup: true/false`
8. Detectar dependencias críticas entre tareas F1
9. Detectar riesgos iniciales evidentes

**Criterio de avance:** Mínimo 2 fases, al menos 3 tareas F1 con fecha.

---

### Paso 3 — Validar y preparar `[project_manager_agent]`

Seguir `directives/new_project_creation.md`:

1. Leer `memory/active_projects.md` — verificar que no existe duplicado por nombre
2. Si existe duplicado: notificar al usuario y detener
3. Leer último `PRJ-XXX` para asignar el siguiente ID
4. Leer conteo de `DEC-XXX` en `decisions_log.md`
5. Leer conteo de `RR-XXX` en `risks_log.md`
6. Construir el `ProjectInput` payload completo:

```typescript
{
  project_name:        // normalizado
  project_description: // inferido del objetivo + tipo
  objective:           // del intérprete
  priority:            // inferida (P1-P4)
  start_date:          // hoy (YYYY-MM-DD)
  target_date:         // del intérprete o "TBD"
  phases:              // del roadmap
  milestones:          // del roadmap
  tasks:               // del roadmap (F1 detalladas + F2+ alto nivel)
  risks:               // del roadmap
  clickup_space_id:    // de configuración o null
  clickup_folder_id:   // de configuración o null
  clickup_list_id:     // de configuración o null
}
```

---

### Paso 4 — Ejecutar bootstrap `[operations_agent]`

Seguir `execution/project_creator.md` → invocar `app/services/project_bootstrap.service.ts`:

```
bootstrapProject(projectInput, {
  existingProjectIds:    // lista de PRJ-XXX de active_projects.md
  existingDecisionCount: // número de DEC-XXX en decisions_log.md
  existingRiskCount:     // número de RR-XXX en risks_log.md
})
```

El servicio ejecuta internamente:
1. `validateProjectInput()` — detener si hay errores críticos
2. `createInitialTasks()` — solo tareas F1, solo si `clickup_list_id` disponible
3. `registerProjectMemory()` — genera los 3 bloques Markdown
4. `buildProjectSummary()` — agrega resultado completo

**Retorna:** `{ success, summary, memory }`

---

### Paso 5 — Persistir en memoria `[operations_agent]`

Con los bloques generados por `registerProjectMemory()`:

1. **Agregar** `memory.active_project_block` al final de `memory/active_projects.md`
2. **Agregar** `memory.decision_entry` al final de `memory/decisions_log.md`
3. **Agregar** `memory.risk_entries` al final de `memory/risks_log.md` (solo si hay riesgos)

Si alguna escritura falla: reportar al `project_manager_agent` — no continuar al Paso 6.

---

### Paso 6 — Registrar riesgos `[risk_agent]`

1. Leer los riesgos detectados en el roadmap
2. Verificar que fueron escritos correctamente en `risks_log.md`
3. Identificar riesgos Alto o Crítico — escalar al `project_manager_agent`
4. Si hay riesgo Crítico: incluir advertencia explícita en el resumen final

No bloquea el flujo — solo registra y escala.

---

### Paso 7 — Sincronizar con ClickUp si hubo fallos parciales `[operations_agent]`

Si `summary.tasks_failed > 0`:
- Registrar las tareas fallidas en `active_projects.md` con `ClickUp ID: null`
- Marcarlas como pendientes de re-sincronización
- Invocar `directives/clickup_sync.md` en la próxima sesión, no ahora

Si `summary.tasks_in_clickup === 0` y `clickup_list_id` estaba disponible:
- Reportar error de configuración — no reintentar automáticamente

---

### Paso 8 — Generar resumen para el usuario `[reporting_agent]`

Producir un mensaje de confirmación con esta estructura:

```
✓ Proyecto creado: [Nombre] (PRJ-XXX)
  Objetivo: [objetivo]
  Fecha límite: [target_date]
  Fases: [N] | Milestones: [N] | Tareas creadas: [N]
  En ClickUp: [N tareas] | Solo en memoria: [N tareas]

[Si hay riesgos altos]: ⚠ [N] riesgo(s) detectado(s) — ver risks_log.md
[Si hubo fallos]: ⚠ [N] tarea(s) no se pudieron sincronizar con ClickUp
[Si no hay ClickUp]: ℹ Sin sincronización — agrega clickup_list_id cuando esté disponible

Primera tarea: "[nombre tarea de arranque]" — [fecha]
```

---

## Manejo de Errores

| Error | Causa | Acción |
|-------|-------|--------|
| `project_name` o `objective` vacío | Validación falla | Detener — volver al Paso 1 y pedir al usuario |
| Proyecto duplicado en memoria | Nombre ya existe | Detener — notificar al usuario, ofrecer actualizar el existente |
| `CLICKUP_API_TOKEN` no configurado | `.env` incompleto | Continuar sin ClickUp — registrar todo en memoria |
| `clickup_list_id` no disponible | Sin configuración | Continuar sin sync — informar al usuario cómo configurarlo |
| 401 Unauthorized en ClickUp | Token inválido o expirado | Detener sync — registrar en memoria — reportar al usuario |
| 404 en list_id | Lista no existe | Marcar `clickup_list_id: null` — continuar sin sync |
| 429 Rate limit | Demasiadas requests | Esperar 60s — reintentar una vez — si falla, registrar como pendiente |
| Fallo parcial de tareas en ClickUp | Error por tarea | Continuar con las demás — reportar al final qué falló |
| Escritura en memoria falla | Error de sistema de archivos | Detener — reportar error crítico al usuario |
| Roadmap tiene 0 tareas F1 | Planning deficiente | Detener — volver al Paso 2 |

---

## Condiciones de Parada

El flujo se detiene completamente en:
- Proyecto duplicado detectado en memoria
- `project_name` u `objective` nulos después del Paso 1
- Fallo al escribir en `active_projects.md` (memoria primaria)
- 0 tareas F1 generadas por el `planning_agent`

El flujo **continúa con degradación** en:
- Sin `clickup_list_id` → todo en memoria
- Fallos parciales en ClickUp → tareas fallidas en memoria, resto ok
- Sin riesgos detectados → `risks_log.md` sin nuevas entradas

---

## Outputs del Flujo

| Output | Archivo | Condición |
|--------|---------|-----------|
| Bloque de proyecto con fases, milestones y tareas | `active_projects.md` | Siempre |
| Entrada de decisión de creación | `decisions_log.md` | Siempre |
| Entradas de riesgos iniciales | `risks_log.md` | Solo si hay riesgos detectados |
| Tareas F1 creadas en ClickUp | ClickUp API | Solo si `clickup_list_id` disponible |
| IDs de ClickUp guardados en memoria | `active_projects.md` | Solo si sync exitoso |
| Mensaje de confirmación al usuario | Respuesta del agente | Siempre |

---

## Ejemplo Completo — SaaS de Inventario

**Petición del usuario:**
> "Ayúdame a lanzar mi SaaS de gestión de inventario para pymes. Necesito tenerlo live para el 1 de septiembre"

---

**Paso 1 — Interpretación:**
- Nombre: `Lanzamiento SaaS Gestión de Inventario`
- Objetivo: Lanzar plataforma SaaS en producción con primeros clientes antes del 2026-09-01
- Tipo: SaaS / Lanzamiento
- Prioridad: P1 (fecha dura)
- Deadline: 2026-09-01
- Complejidad: Alta
- Sin preguntas necesarias → confirmar directamente

Confirmación al usuario:
> "Entendido. Voy a crear el proyecto **Lanzamiento SaaS Gestión de Inventario** con el objetivo de tenerlo live el 1 de septiembre. ¿Arrancamos?"

---

**Paso 2 — Roadmap generado:**
```
Fase F1 — Producto y diseño:     2026-05-08 → 2026-06-05
Fase F2 — Desarrollo:            2026-06-05 → 2026-08-01
Fase F3 — Testing y lanzamiento: 2026-08-01 → 2026-09-01

Milestones:
  - Diseños aprobados — 2026-06-05 — F1
  - Funcionalidades core en staging — 2026-08-01 — F2
  - App en producción con 5 primeros clientes — 2026-09-01 — F3

Tareas F1 (send_to_clickup: true):
  - Definir MVP: funcionalidades core — P1 — 2026-05-12
  - Diseñar wireframes de flujos principales — P1 — 2026-05-20
  - Diseñar sistema de componentes UI — P2 — 2026-05-28
  - Definir modelo de datos inicial — P1 — 2026-05-15
  - Configurar entorno de desarrollo y CI/CD — P2 — 2026-05-18

Riesgos detectados:
  - 17 semanas para MVP completo es ajustado — Severidad: Alto
  - Captación de primeros clientes sin plan aún — Severidad: Medio
```

---

**Paso 3 — Payload preparado:**
```typescript
{
  project_name: "Lanzamiento SaaS Gestión de Inventario",
  objective: "Lanzar plataforma SaaS en producción con primeros clientes antes del 2026-09-01",
  priority: "P1",
  start_date: "2026-05-08",
  target_date: "2026-09-01",
  clickup_list_id: "abc123",   // de configuración
  phases: [ F1, F2, F3 ],
  milestones: [ 3 milestones ],
  tasks: [ 5 tareas F1 + tareas F2/F3 alto nivel ],
  risks: [ 2 riesgos ]
}
```

---

**Paso 4 — Bootstrap ejecutado:**
```
bootstrapProject(payload, { existingProjectIds: [], existingDecisionCount: 0, existingRiskCount: 0 })

→ validateProjectInput(): OK
→ createInitialTasks(): 5 tareas F1 enviadas a ClickUp
    ✓ "Definir MVP..." → ID: abc001
    ✓ "Diseñar wireframes..." → ID: abc002
    ✓ "Diseñar sistema de componentes..." → ID: abc003
    ✓ "Definir modelo de datos..." → ID: abc004
    ✓ "Configurar entorno..." → ID: abc005
→ registerProjectMemory(): bloques generados
→ buildProjectSummary(): OK
```

---

**Paso 5 — Memoria persistida:**
- `active_projects.md` → bloque PRJ-001 con 5 tareas F1 con IDs + tareas F2/F3 con null
- `decisions_log.md` → DEC-001
- `risks_log.md` → RR-001 (deadline ajustado, Alto) + RR-002 (captación sin plan, Medio)

---

**Paso 6 — Riesgos escalados:**
- `risk_agent` detecta RR-001 como Alto → escala al `project_manager_agent`
- `project_manager_agent` incluye advertencia en el resumen final

---

**Paso 8 — Resumen al usuario:**
```
✓ Proyecto creado: Lanzamiento SaaS Gestión de Inventario (PRJ-001)
  Objetivo: Lanzar plataforma SaaS en producción con primeros clientes antes del 2026-09-01
  Fecha límite: 2026-09-01
  Fases: 3 | Milestones: 3 | Tareas creadas: 5 (Fase 1)

  En ClickUp: 5 tareas | Tareas futuras en memoria: [F2, F3]

⚠ 1 riesgo alto detectado: el plazo de 17 semanas para el MVP es ajustado.
  Recomendación: confirmar que el producto ya tiene desarrollo previo.

Primera tarea: "Definir MVP: funcionalidades core" — 2026-05-12
```
