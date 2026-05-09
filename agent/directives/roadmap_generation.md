# Directive: Roadmap Generation

## Objetivo

Convertir un objetivo de proyecto en una estructura operativa inicial — fases, milestones, tareas, prioridades, dependencias y riesgos — que sea accionable desde el primer día sin caer en sobreplanificación.

El roadmap generado es una **estructura mínima viable**: suficiente para empezar a trabajar, no tan detallada que tome más tiempo planificar que ejecutar.

---

## Cuándo se Activa

Activada por `planning_agent` en los siguientes casos:

- Al crear un proyecto nuevo (después de `directives/new_project_creation.md`)
- Cuando el `project_manager_agent` detecta que un proyecto activo no tiene estructura de fases
- Cuando el usuario pide explícitamente un "plan", "roadmap" o "estructura" para un proyecto existente
- Después de un replanning significativo (cambio de scope o fecha límite)

---

## Inputs Mínimos

| Campo | Obligatorio | Fuente |
|-------|-------------|--------|
| `project_name` | Sí | Memoria / usuario |
| `objective` | Sí | Memoria / usuario |
| `project_type` | Recomendado | Inferido por `project_request_interpreter.md` |
| `target_date` | Recomendado | Memoria / usuario (`TBD` si no está) |
| `complexity` | Opcional | Inferido en esta directive |
| `known_constraints` | Opcional | Memoria / usuario |

---

## Paso 1 — Evaluar Complejidad, Tamaño y Duración

Antes de generar estructura, el `planning_agent` debe calibrar el proyecto.

### Complejidad

| Nivel | Señales | Implicación |
|-------|---------|-------------|
| **Baja** | 1 persona, 1 área, objetivo claro, sin dependencias externas, ≤ 4 semanas | 2 fases, 3-4 tareas/fase |
| **Media** | 2-3 personas o áreas, algunas dependencias externas, 4-12 semanas | 3 fases, 4-5 tareas/fase |
| **Alta** | Múltiples equipos, integraciones, dependencias críticas, > 12 semanas | 4-5 fases, 5-6 tareas/fase |

### Duración estimada por tipo de proyecto

Si `target_date` es `TBD`, usar estas referencias:

| Tipo de proyecto | Duración típica | Fases |
|-----------------|----------------|-------|
| Startup / SaaS (MVP) | 16-24 semanas | 4 |
| Desarrollo técnico | 8-16 semanas | 3-4 |
| Automatización | 6-12 semanas | 3 |
| Lanzamiento / GTM | 4-8 semanas | 3 |
| Inmobiliario | 8-24 semanas | 4 |
| Reforma / Construcción | 12-52 semanas | 4 |
| Operativo / Proceso | 4-10 semanas | 3 |
| Marketing / Contenido | 2-6 semanas | 2-3 |
| Investigación | 3-8 semanas | 3 |

### Áreas implicadas

Identificar qué áreas de trabajo están presentes según el tipo y el objetivo:

| Área | Presente cuando... |
|------|--------------------|
| Producto / UX | Hay que diseñar o definir algo que alguien usará |
| Desarrollo / Técnica | Hay código, sistemas, integraciones o automatizaciones |
| Legal / Normativo | Hay permisos, contratos, cumplimiento o regulación |
| Financiero | Hay presupuesto, inversión, financiación o costes relevantes |
| Comercial / Ventas | Hay captación de clientes, negociación o cierre de ventas |
| Marketing / Comunicación | Hay posicionamiento, audiencia o comunicación externa |
| Operaciones | Hay procesos, recursos humanos o logística |
| Investigación | Hay análisis previo, validación o benchmarking |

---

## Paso 2 — Dividir el Proyecto en Fases

### Reglas

- **Mínimo 2 fases**, **máximo 5** (para proyectos largos, dividir fase de ejecución)
- Cada fase debe tener un **entregable claro** al terminar
- Cada fase debe caber en la mente del usuario en una sola frase
- Las fechas de fase se calculan distribuyendo el tiempo total proporcionalmente según la carga estimada

### Plantillas de fases por tipo de proyecto

**Startup / SaaS:**
```
Fase 1 — Definición y validación    (15% del tiempo)
Fase 2 — Diseño y arquitectura      (20% del tiempo)
Fase 3 — Desarrollo MVP             (40% del tiempo)
Fase 4 — Lanzamiento y tracción     (25% del tiempo)
```

**Desarrollo técnico / Automatización:**
```
Fase 1 — Análisis y diseño          (20% del tiempo)
Fase 2 — Implementación             (50% del tiempo)
Fase 3 — Testing y despliegue       (30% del tiempo)
```

**Inmobiliario:**
```
Fase 1 — Análisis y due diligence   (25% del tiempo)
Fase 2 — Negociación y financiación (30% del tiempo)
Fase 3 — Cierre y trámites legales  (30% del tiempo)
Fase 4 — Gestión post-adquisición   (15% del tiempo)
```

**Reforma / Construcción:**
```
Fase 1 — Proyecto y permisos        (15% del tiempo)
Fase 2 — Contratación y preparación (10% del tiempo)
Fase 3 — Ejecución de obra          (60% del tiempo)
Fase 4 — Acabados y entrega         (15% del tiempo)
```

**Operativo / Proceso:**
```
Fase 1 — Diagnóstico y diseño       (25% del tiempo)
Fase 2 — Implementación             (50% del tiempo)
Fase 3 — Estabilización             (25% del tiempo)
```

**Marketing / Contenido / Lanzamiento:**
```
Fase 1 — Estrategia y producción    (40% del tiempo)
Fase 2 — Ejecución y distribución   (40% del tiempo)
Fase 3 — Análisis y optimización    (20% del tiempo)
```

**Investigación:**
```
Fase 1 — Diseño y recopilación      (40% del tiempo)
Fase 2 — Análisis                   (35% del tiempo)
Fase 3 — Síntesis y entrega         (25% del tiempo)
```

---

## Paso 3 — Generar Milestones

### Reglas

- **1 milestone por fase** como mínimo (el entregable que marca el fin de fase)
- Máximo 2 milestones por fase (solo si hay un punto de control intermedio crítico)
- Un milestone es un **evento verificable**, no una tarea en curso
- Formato: "X está listo / aprobado / publicado / firmado"

### Ejemplos de buenos milestones

| Malo (tarea) | Bueno (milestone) |
|-------------|------------------|
| "Escribir el código del módulo de pagos" | "Módulo de pagos funcionando en staging" |
| "Reunirse con el banco" | "Financiación aprobada y confirmada" |
| "Diseñar la app" | "Diseños aprobados por el equipo" |
| "Tramitar permisos" | "Licencia de obra concedida" |

---

## Paso 4 — Generar Tareas Iniciales

### Reglas de generación

- Solo generar tareas para **la fase 1 activa** en detalle
- Para fases futuras: solo incluir las tareas de alto nivel más evidentes (2-3 por fase)
- **Máximo 6 tareas por fase** en el roadmap inicial — el detalle se añade cuando la fase se activa
- Cada tarea debe ser completable en **1 a 5 días laborables**
- Si una tarea tomaría más de 5 días, dividirla

### Formato de tarea

```
- Nombre: [verbo + objeto concreto]
- Descripción: [qué hay que hacer y qué se obtiene al terminar]
- Fase: [F1 / F2 / ...]
- Área: [área de trabajo]
- Prioridad: [P1 / P2 / P3 / P4]
- Duración estimada: [1d / 2d / 3d / 5d]
- Fecha estimada: [YYYY-MM-DD]
- Depende de: [nombre de tarea o null]
```

### Tarea de arranque

Siempre identificar la **tarea de arranque** — la primera acción concreta que desbloquea el resto. Marcarla como P1 y asignarle la fecha más próxima posible.

---

## Paso 5 — Priorizar Tareas

Aplicar la matriz 2×2 de impacto vs. urgencia:

| | Alta urgencia | Baja urgencia |
|--|--------------|--------------|
| **Alto impacto** | **P1** — Hacer primero | **P2** — Planificar esta semana |
| **Bajo impacto** | **P3** — Delegar o programar | **P4** — Eliminar o posponer |

### Criterios de urgencia

- Alta urgencia: bloquea otras tareas, tiene fecha fija externa, o tiene consecuencias si se retrasa
- Baja urgencia: puede hacerse en cualquier momento dentro de la fase

### Criterios de impacto

- Alto impacto: acerca directamente al milestone de la fase o al objetivo del proyecto
- Bajo impacto: necesaria pero no crítica para el avance principal

**Regla práctica:** En el roadmap inicial, al menos el 50% de las tareas de Fase 1 deben ser P1 o P2.

---

## Paso 6 — Detectar Dependencias

Solo registrar dependencias **críticas** — las que realmente bloquean el avance si no están resueltas.

### Tipos de dependencia

| Tipo | Ejemplo | Cómo registrarlo |
|------|---------|-----------------|
| **Secuencial interna** | Tarea B no puede empezar hasta que A termine | `depende de: [nombre tarea A]` |
| **Externa bloqueante** | Necesita aprobación de un tercero | Crear tarea explícita de gestión + marcar como riesgo |
| **Recurso no confirmado** | Necesita un perfil técnico aún sin contratar | Crear tarea de contratación en F1 |
| **Dato/información** | Necesita acceso a un sistema o documento externo | Crear tarea de obtención en F1 |

### Qué NO registrar como dependencia

- Dependencias triviales que son obvias por el orden natural
- Dependencias entre tareas de fases lejanas (se gestionan cuando llegue la fase)
- Dependencias internas de baja consecuencia

---

## Paso 7 — Detectar Riesgos Iniciales

En el momento de generar el roadmap, identificar riesgos a partir del contexto:

### Señales de riesgo por categoría

| Categoría | Señal | Severidad por defecto |
|-----------|-------|----------------------|
| **Plazo** | Deadline muy corto para la complejidad estimada | Alto |
| **Recursos** | Perfiles clave no confirmados | Medio |
| **Externo** | Dependencias con terceros (banco, notaría, proveedor, cliente) | Medio-Alto |
| **Técnico** | Integraciones con sistemas existentes sin documentar | Medio |
| **Legal/Normativo** | Permisos o aprobaciones no iniciadas | Alto |
| **Financiero** | Presupuesto no confirmado o insuficiente | Alto |
| **Scope** | Objetivo poco definido o cambiante | Medio |

Registrar cada riesgo en `memory/risks_log.md` con el formato estándar.

---

## Paso 8 — Evitar Sobreplanificación

### Reglas anti-sobreplanificación

1. **No generar más de 6 tareas por fase en el roadmap inicial** — las tareas de detalle se añaden cuando la fase se activa
2. **No planificar más allá de 2 semanas con fecha exacta** — las tareas de fases futuras tienen fechas aproximadas o de fase
3. **No crear subtareas** en el roadmap inicial — solo tareas de primer nivel
4. **No incluir tareas de soporte genérico** ("hacer reunión de seguimiento", "revisar progreso") — esas son actividades, no tareas accionables
5. **Si el roadmap tiene más de 30 tareas en total**, simplificar — probablemente hay tareas demasiado granulares o fases mal definidas

### Test de simplicidad

Antes de entregar el roadmap, verificar:
- [ ] ¿Puede el usuario entender la estructura completa en 2 minutos?
- [ ] ¿Cada fase tiene un entregable claro?
- [ ] ¿La primera tarea a ejecutar está identificada?
- [ ] ¿Hay menos de 30 tareas en total?
- [ ] ¿Las tareas de fase 1 tienen fechas concretas?

---

## Paso 9 — Decidir qué va a ClickUp y qué queda en Memoria

### Regla general

**Solo la Fase 1 activa va a ClickUp** en la creación inicial.

| Criterio | Destino |
|----------|---------|
| Tarea de Fase 1 con fecha concreta | ClickUp + memoria |
| Tarea de Fase 1 sin fecha | Solo memoria (sincronizar cuando tenga fecha) |
| Milestone de Fase 1 | ClickUp como tarea de control + memoria |
| Tareas de Fase 2+ | Solo memoria (mover a ClickUp cuando la fase se active) |
| Tareas P4 sin fecha | Solo memoria |
| No hay `clickup_list_id` | Todo solo en memoria |

**Razonamiento:** ClickUp debe reflejar el trabajo activo, no el trabajo futuro. Un tablero con 40 tareas desde el día 1 es ruido, no gestión.

---

## Outputs Esperados

| Output | Formato | Destino |
|--------|---------|---------|
| Estructura de fases con fechas | Lista en `active_projects.md` | Memoria |
| Lista de milestones | Checkboxes con fecha y fase | `active_projects.md` |
| Tareas de Fase 1 (detalladas) | Tabla con fase, prioridad, fecha, área | `active_projects.md` + ClickUp |
| Tareas de fases futuras (alto nivel) | Lista simple con fase | `active_projects.md` |
| Riesgos detectados | Formato estándar RR-XXX | `risks_log.md` |
| Decisiones de estructura | Formato estándar DEC-XXX | `decisions_log.md` |

---

## Ejemplos Completos

---

### Ejemplo 1 — Startup de IA (gestión de reuniones)

**Inputs:**
- Objetivo: Lanzar un producto de IA que automatice la gestión de reuniones para equipos remotos
- Tipo: Startup / SaaS
- Deadline: 2026-12-31
- Complejidad: Alta

**Duración total:** 34 semanas

**Fases:**
```
Fase 1 — Validación y definición     2026-05-08 → 2026-06-06  (4 semanas, 12%)
Fase 2 — Diseño y arquitectura       2026-06-06 → 2026-07-04  (4 semanas, 12%)
Fase 3 — Desarrollo MVP              2026-07-04 → 2026-10-10  (14 semanas, 41%)
Fase 4 — Beta y lanzamiento          2026-10-10 → 2026-12-31  (12 semanas, 35%)
```

**Milestones:**
- [ ] Problema validado con 10 entrevistas a usuarios — 2026-06-06 — F1
- [ ] Arquitectura técnica aprobada — 2026-07-04 — F2
- [ ] MVP funcionando en staging — 2026-10-10 — F3
- [ ] 100 usuarios activos en beta — 2026-12-15 — F4
- [ ] Producto en producción — 2026-12-31 — F4

**Tareas Fase 1 (→ ClickUp):**
| Tarea | Área | P | Fecha |
|-------|------|---|-------|
| Definir hipótesis del producto en 1 página | Producto | P1 | 2026-05-12 |
| Diseñar guión de entrevistas a usuarios | Investigación | P1 | 2026-05-14 |
| Realizar 10 entrevistas a potenciales usuarios | Investigación | P1 | 2026-05-30 |
| Definir métricas de éxito del MVP | Producto | P2 | 2026-06-03 |
| Documentar stack tecnológico candidato | Técnica | P2 | 2026-06-05 |

**Riesgos iniciales:**
- Recursos técnicos no confirmados para Fase 3 — Severidad: Alto
- Mercado competitivo — validar diferenciación real en Fase 1 — Severidad: Medio

---

### Ejemplo 2 — SaaS de gestión de inventario

**Inputs:**
- Objetivo: Lanzar SaaS de gestión de inventario para pymes, live antes del 2026-09-01
- Tipo: SaaS / Lanzamiento
- Deadline: 2026-09-01
- Complejidad: Alta

**Duración total:** 17 semanas

**Fases:**
```
Fase 1 — Producto y diseño           2026-05-08 → 2026-06-05  (4 semanas)
Fase 2 — Desarrollo                  2026-06-05 → 2026-08-01  (8 semanas)
Fase 3 — Testing y lanzamiento       2026-08-01 → 2026-09-01  (4 semanas)
```

**Milestones:**
- [ ] Diseños de UI aprobados y sistema de componentes listo — 2026-06-05 — F1
- [ ] Funcionalidades core en staging — 2026-08-01 — F2
- [ ] App en producción con primeros 5 clientes — 2026-09-01 — F3

**Tareas Fase 1 (→ ClickUp):**
| Tarea | Área | P | Fecha |
|-------|------|---|-------|
| Definir MVP: listado de funcionalidades core | Producto | P1 | 2026-05-12 |
| Crear wireframes de flujos principales | UX | P1 | 2026-05-20 |
| Diseñar sistema de componentes UI | UX | P2 | 2026-05-28 |
| Definir modelo de datos inicial | Técnica | P1 | 2026-05-15 |
| Configurar entorno de desarrollo y CI/CD | Técnica | P2 | 2026-05-18 |

**Riesgos iniciales:**
- 17 semanas para MVP completo es ajustado — confirmar que product está avanzado — Severidad: Alto
- Captación de primeros clientes no planificada aún — Severidad: Medio

---

### Ejemplo 3 — Automatización de tramitación urbanística

**Inputs:**
- Objetivo: Automatizar el proceso de tramitación de licencias urbanísticas del ayuntamiento
- Tipo: Automatización / Desarrollo técnico
- Deadline: TBD → usar 20 semanas como referencia
- Complejidad: Alta

**Fases:**
```
Fase 1 — Análisis y diseño           2026-05-08 → 2026-06-05  (4 semanas)
Fase 2 — Desarrollo e integración    2026-06-05 → 2026-09-04  (13 semanas)
Fase 3 — Piloto y despliegue         2026-09-04 → 2026-10-16  (6 semanas)
```

**Milestones:**
- [ ] Proceso actual documentado y nuevo proceso diseñado aprobado — 2026-06-05 — F1
- [ ] Sistema integrado con plataforma del ayuntamiento en staging — 2026-09-04 — F2
- [ ] Sistema en producción procesando solicitudes reales — 2026-10-16 — F3

**Tareas Fase 1 (→ ClickUp):**
| Tarea | Área | P | Fecha |
|-------|------|---|-------|
| Mapear proceso actual de tramitación (AS-IS) | Operaciones | P1 | 2026-05-15 |
| Identificar sistemas existentes a integrar | Técnica | P1 | 2026-05-18 |
| Revisar normativa que afecta la automatización | Legal | P1 | 2026-05-20 |
| Diseñar proceso automatizado objetivo (TO-BE) | Operaciones | P2 | 2026-05-29 |
| Definir arquitectura técnica de la solución | Técnica | P2 | 2026-06-03 |

**Riesgos iniciales:**
- Dependencias con sistemas del ayuntamiento sin documentar — Severidad: Alto
- Normativa puede limitar o ralentizar la automatización — Severidad: Alto
- Proceso de aprobación interna del ayuntamiento impredecible — Severidad: Medio

---

### Ejemplo 4 — Proyecto inmobiliario (compra de inversión)

**Inputs:**
- Objetivo: Evaluar 3 propiedades identificadas y cerrar la compra de la más conveniente
- Tipo: Inmobiliario
- Deadline: TBD → 16 semanas como referencia
- Complejidad: Media

**Fases:**
```
Fase 1 — Análisis y due diligence    2026-05-08 → 2026-06-05  (4 semanas)
Fase 2 — Negociación y financiación  2026-06-05 → 2026-07-17  (6 semanas)
Fase 3 — Cierre legal y escritura    2026-07-17 → 2026-08-21  (5 semanas)
Fase 4 — Gestión post-adquisición    2026-08-21 → 2026-09-04  (2 semanas)
```

**Milestones:**
- [ ] Propiedad seleccionada con análisis financiero completo — 2026-06-05 — F1
- [ ] Financiación aprobada y oferta aceptada — 2026-07-17 — F2
- [ ] Escritura firmada ante notario — 2026-08-21 — F3
- [ ] Propiedad registrada y gestionada — 2026-09-04 — F4

**Tareas Fase 1 (→ ClickUp):**
| Tarea | Área | P | Fecha |
|-------|------|---|-------|
| Elaborar ficha comparativa de las 3 propiedades | Financiero | P1 | 2026-05-14 |
| Analizar rentabilidad de cada opción (ROI, cashflow) | Financiero | P1 | 2026-05-20 |
| Verificar situación legal y cargas de cada inmueble | Legal | P1 | 2026-05-22 |
| Visitar presencialmente las 3 propiedades | Operaciones | P2 | 2026-05-26 |
| Decidir propiedad objetivo — registrar en decisions_log | PM | P1 | 2026-06-03 |

**Riesgos iniciales:**
- Financiación bancaria no confirmada — puede bloquear toda la operación — Severidad: Alto
- Estado legal de alguna propiedad puede ser problemático — Severidad: Medio
- Vendedor puede retirar la propiedad del mercado — Severidad: Medio

---

### Ejemplo 5 — Reforma integral de apartamento

**Inputs:**
- Objetivo: Completar la reforma integral del apartamento con todos los gremios coordinados
- Tipo: Reforma / Construcción
- Start: 2026-06-01
- Deadline: TBD → 24 semanas como referencia
- Complejidad: Alta

**Fases:**
```
Fase 1 — Proyecto y permisos         2026-05-08 → 2026-06-01  (4 semanas, antes del inicio)
Fase 2 — Contratación                2026-06-01 → 2026-06-22  (3 semanas)
Fase 3 — Obra y ejecución            2026-06-22 → 2026-10-16  (17 semanas)
Fase 4 — Acabados y entrega          2026-10-16 → 2026-11-13  (4 semanas)
```

**Milestones:**
- [ ] Proyecto de reforma aprobado y licencia solicitada — 2026-06-01 — F1
- [ ] Todos los gremios contratados y con fechas confirmadas — 2026-06-22 — F2
- [ ] Estructura, fontanería y electricidad completadas — 2026-09-01 — F3
- [ ] Reforma terminada y entregada — 2026-11-13 — F4

**Tareas Fase 1 (→ ClickUp):**
| Tarea | Área | P | Fecha |
|-------|------|---|-------|
| Contratar arquitecto o aparejador para el proyecto | Operaciones | P1 | 2026-05-14 |
| Definir alcance completo de la reforma (qué se toca) | Producto | P1 | 2026-05-15 |
| Solicitar 3 presupuestos a empresas de reforma | Financiero | P1 | 2026-05-22 |
| Tramitar solicitud de licencia de obras | Legal | P1 | 2026-05-28 |
| Definir calendario de obra con gremios | Operaciones | P2 | 2026-05-30 |

**Riesgos iniciales:**
- Licencia de obras puede retrasarse — bloquea todo el arranque — Severidad: Alto
- Desviación presupuestaria habitual en reformas (prever +15%) — Severidad: Medio
- Coordinación entre gremios — retrasos en cadena — Severidad: Medio
