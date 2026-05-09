# Directive: Project Request Interpreter

## Objetivo

Interpretar peticiones naturales del usuario relacionadas con creación o gestión de proyectos, extraer la información necesaria con el mínimo de fricción, y activar el proceso de creación cuando haya suficiente contexto para actuar.

Este archivo es el punto de entrada del sistema ante cualquier intención de proyecto expresada en lenguaje natural.

---

## Cuándo se Activa

Se activa cuando el `project_manager_agent` detecta que el usuario:

- Expresa intención de crear algo nuevo ("quiero crear", "necesito lanzar", "voy a empezar")
- Describe un objetivo o problema que requiere organización ("necesito estructurar", "ayúdame a organizar", "cómo lanzo")
- Usa palabras clave de proyecto: "roadmap", "plan", "proyecto", "lanzamiento", "campaña", "reforma", "desarrollo", "implementar"
- Describe un resultado futuro con alcance no trivial ("quiero tener X listo para Y fecha")

**No se activa si:**
- El usuario hace una pregunta informativa sin intención de acción
- El usuario quiere actualizar un proyecto ya existente (usar `weekly_review.md` o `clickup_sync.md`)
- El usuario quiere agregar una tarea suelta a un proyecto activo

---

## Cómo Detectar Intención de Creación

### Señales primarias (alta confianza — actuar directamente)

| Patrón | Ejemplo |
|--------|---------|
| "Quiero crear un proyecto..." | "Quiero crear un proyecto para lanzar mi app" |
| "Necesito organizar..." | "Necesito organizar el lanzamiento de mi startup" |
| "Ayúdame a lanzar..." | "Ayúdame a lanzar una campaña de marketing" |
| "Crea un roadmap para..." | "Crea un roadmap para mi SaaS" |
| "Vamos a arrancar..." | "Vamos a arrancar el desarrollo del MVP" |

### Señales secundarias (media confianza — confirmar antes de crear)

| Patrón | Ejemplo | Qué confirmar |
|--------|---------|--------------|
| Descripción de problema sin petición explícita | "Tengo que reorganizar el proceso de ventas" | "¿Quieres que lo gestione como un proyecto?" |
| Objetivo expresado sin estructura | "Necesito tener el sitio web listo en junio" | Tratar directamente como proyecto con deadline |
| Lista de tareas sin contexto | "Hay que hacer X, Y y Z para el producto" | "¿Las agrupo en un proyecto?" |

### Señales ambiguas (baja confianza — no crear sin confirmación)

- Preguntas generales sobre cómo hacer algo
- Menciones de ideas sin compromiso ("algún día me gustaría...")
- Contexto insuficiente para inferir un proyecto concreto

---

## Cómo Extraer Información del Request

El `project_manager_agent` debe intentar inferir estos campos del texto del usuario **antes de preguntar**. Solo preguntar lo que no puede inferirse razonablemente.

### Campos a extraer

| Campo | Cómo inferirlo | Ejemplo de inferencia |
|-------|---------------|----------------------|
| **Nombre del proyecto** | Sustantivo central + acción del request | "lanzar app de fitness" → "Lanzamiento App Fitness" |
| **Objetivo** | El resultado final descrito por el usuario | "tener la app publicada en App Store" |
| **Tipo de proyecto** | Palabras clave del dominio (ver tabla más abajo) | "startup", "SaaS", "reforma", "inmobiliario" |
| **Prioridad** | Urgencia implícita, fecha mencionada, énfasis del usuario | "para mañana" → P1; "cuando pueda" → P3 |
| **Deadline** | Cualquier referencia temporal ("para junio", "en 3 meses", "antes de fin de año") | "para junio" → 2026-06-30 |
| **Complejidad** | Número de áreas, personas o sistemas implicados | múltiples equipos + integración técnica → Alta |
| **Áreas implicadas** | Dominios mencionados explícita o implícitamente | "marketing, dev, diseño" |

### Clasificación por tipo de proyecto

| Tipo | Palabras clave | Características por defecto |
|------|---------------|---------------------------|
| **Startup / SaaS** | startup, app, saas, mvp, producto, plataforma | 4 fases, 12-24 semanas, alta complejidad |
| **Lanzamiento** | lanzar, launch, campaña, go-to-market | 3 fases, 4-8 semanas, media complejidad |
| **Desarrollo técnico** | desarrollo, implementar, integrar, automatizar, api | 4 fases, 8-16 semanas, alta complejidad |
| **Reforma / Construcción** | reforma, obra, construcción, inmobiliario, urbanismo | 4 fases, 12-52 semanas, alta complejidad |
| **Operativo / Proceso** | organizar, restructurar, proceso, workflow, operación | 3 fases, 4-12 semanas, media complejidad |
| **Marketing / Contenido** | campaña, contenido, redes, newsletter, branding | 2-3 fases, 2-8 semanas, baja-media complejidad |
| **Inmobiliario** | inmueble, propiedad, compra, venta, alquiler, inversión | 4 fases, 4-24 semanas, media-alta complejidad |
| **Investigación / Consultoría** | investigar, analizar, auditar, diagnosticar, propuesta | 3 fases, 4-8 semanas, media complejidad |

### Evaluación de complejidad

| Complejidad | Criterios | Implicación |
|-------------|----------|-------------|
| **Baja** | 1 persona, 1 área, objetivo claro, sin dependencias externas | 2-3 fases, 3-5 tareas/fase |
| **Media** | 2-3 personas o áreas, alguna dependencia externa | 3-4 fases, 4-6 tareas/fase |
| **Alta** | Múltiples equipos, integraciones, dependencias críticas, larga duración | 4-5 fases, 5-7 tareas/fase |

---

## Cómo Decidir si hay Suficiente Información

### Regla de los 3 mínimos

El sistema puede arrancar si tiene los 3 campos obligatorios:

1. **Nombre** — aunque sea provisional
2. **Objetivo** — aunque sea general
3. **Deadline o duración estimada** — aunque sea aproximada ("3 meses", "Q3 2026")

Si los 3 están presentes (explícita o inferiblemente), **iniciar sin preguntar más**.

### Árbol de decisión

```
¿Hay nombre + objetivo + deadline?
  ├─ Sí → Iniciar directamente con new_project_creation.md
  └─ No →
        ¿Falta solo el deadline?
          ├─ Sí → Asumir "sin fecha fija" (TBD) e iniciar
          └─ No →
                ¿Falta el objetivo?
                  ├─ Sí → Hacer 1 pregunta (ver preguntas mínimas)
                  └─ No → Inferir nombre del objetivo e iniciar
```

---

## Preguntas Mínimas

**Regla estricta: máximo 2 preguntas por turno. Nunca pedir lo que se puede inferir.**

### Pregunta 1 — Si falta el objetivo

> "¿Cuál es el resultado concreto que necesitas lograr con este proyecto?"

### Pregunta 2 — Si falta el deadline y el tipo sugiere urgencia

> "¿Tienes alguna fecha límite en mente, o es flexible por ahora?"

### Qué NO preguntar en la fase de interpretación

- No preguntar por stakeholders (se agrega después)
- No preguntar por herramientas o tecnología
- No pedir lista de tareas (el sistema las genera)
- No preguntar por presupuesto a menos que el usuario lo mencione
- No pedir el ID de ClickUp (se puede agregar más tarde)

---

## Proceso de Interpretación

### Paso 1 — Leer y clasificar la petición

- Identificar las señales de intención (primaria / secundaria / ambigua)
- Si es ambigua: confirmar con una sola frase antes de continuar

### Paso 2 — Extraer campos del texto

- Aplicar la tabla de inferencia
- Marcar como `inferido` o `explícito` cada campo para rastrear confianza
- Marcar como `null` lo que genuinamente no puede inferirse

### Paso 3 — Evaluar si hay suficiente información

- Aplicar la regla de los 3 mínimos
- Si hay suficiente: pasar al paso 5
- Si falta algo crítico: pasar al paso 4

### Paso 4 — Hacer las preguntas mínimas necesarias

- Máximo 2 preguntas en un mismo turno
- Esperar respuesta y volver al paso 2

### Paso 5 — Confirmar la interpretación con el usuario (brevemente)

Presentar un resumen de 3-4 líneas antes de crear:

> "Entendido. Voy a crear el proyecto **[nombre]** con el objetivo de **[objetivo]**, con fecha límite **[deadline]**. ¿Arrancamos?"

Si el usuario dice sí (o no objeta en 1 turno): proceder.  
Si el usuario corrige algo: ajustar y volver a confirmar solo si el cambio es significativo.

### Paso 6 — Detectar riesgos iniciales evidentes

Antes de activar la creación, identificar riesgos obvios del contexto:

| Señal de riesgo | Ejemplo | Acción |
|----------------|---------|--------|
| Deadline muy corto para la complejidad | Startup SaaS en 2 semanas | Mencionar la tensión — registrar como riesgo |
| Dependencias externas no confirmadas | "esperando aprobación del cliente" | Registrar como riesgo — marcar tarea como bloqueada |
| Recursos no confirmados | "necesito contratar un dev" | Registrar como riesgo — agregar tarea de contratación |
| Objetivo vago o cambiante | "algo relacionado con IA" | Pedir clarificación antes de crear |

### Paso 7 — Activar el proceso de creación

Invocar en este orden:

1. `directives/new_project_creation.md` — decisión y estructura
2. `execution/project_creator.md` — registro en memoria + ClickUp
3. `execution/clickup_task_creation.md` — invocado internamente por `project_creator.md` si hay `clickup_list_id`

---

## Cómo Registrar Contexto, Decisiones y Riesgos Iniciales

### Contexto — en `memory/active_projects.md`

Al crear el bloque del proyecto, incluir en el campo `Description` la petición original parafraseada:

```
- **Description**: [Resumen de la petición original del usuario + contexto relevante]
```

### Decisiones — en `memory/decisions_log.md`

Registrar una entrada por cada interpretación que requirió inferencia o ajuste:

```markdown
### [DEC-XXX] — Interpretación de petición: {project_name}
- **Fecha**: YYYY-MM-DD
- **Decisión**: [Qué se infirió o decidió y por qué]
- **Contexto**: Petición original: "{texto del usuario}"
- **Campos inferidos**: nombre=[...], objetivo=[...], deadline=[...]
- **Estado**: activo
```

### Riesgos iniciales — en `memory/risks_log.md`

Para cada riesgo detectado en el paso 6, agregar una entrada:

```markdown
### [RR-XXX] — [Título del riesgo]
- **Proyecto**: {project_name}
- **Descripción**: [Riesgo detectado en la petición inicial]
- **Severidad**: [Bajo / Medio / Alto]
- **Probabilidad**: [Baja / Media / Alta]
- **Impacto si se materializa**: [descripción]
- **Plan de mitigación**: [ ] [Acción sugerida]
- **Estado**: Abierto
- **Fecha detectado**: YYYY-MM-DD
```

---

## Outputs Esperados

| Output | Dónde | Condición |
|--------|-------|-----------|
| Proyecto estructurado con fases y tareas | `memory/active_projects.md` | Siempre |
| Interpretación y campos inferidos documentados | `memory/decisions_log.md` | Si hubo inferencia significativa |
| Riesgos iniciales registrados | `memory/risks_log.md` | Solo si se detectaron riesgos evidentes |
| Confirmación al usuario con resumen | Respuesta del agente | Siempre |
| Tareas de fase 1 en ClickUp | ClickUp API | Solo si `clickup_list_id` disponible |

---

## Ejemplos Reales de Uso

---

### Ejemplo 1 — Startup de IA

**Petición del usuario:**
> "Quiero crear una startup de IA que automatice la gestión de reuniones para equipos remotos"

**Interpretación:**
- Nombre inferido: `Startup IA — Automatización de Reuniones`
- Objetivo: Lanzar un producto de IA que automatice la gestión de reuniones para equipos remotos
- Tipo: Startup / SaaS
- Prioridad: P2 (sin urgencia explícita)
- Deadline: TBD (no mencionado)
- Complejidad: Alta (producto técnico + mercado + equipo)
- Áreas: Producto, Desarrollo, Marketing

**Pregunta necesaria:** "¿Tienes una fecha objetivo para tener el MVP listo?"

**Riesgos iniciales detectados:** Recursos técnicos no confirmados

---

### Ejemplo 2 — Automatización de urbanismo

**Petición del usuario:**
> "Necesito automatizar el proceso de tramitación de licencias urbanísticas del ayuntamiento"

**Interpretación:**
- Nombre inferido: `Automatización Tramitación Licencias Urbanísticas`
- Objetivo: Implementar un sistema que automatice la tramitación de licencias reduciendo tiempos y errores manuales
- Tipo: Desarrollo técnico / Operativo
- Prioridad: P2
- Deadline: TBD
- Complejidad: Alta (integración con sistemas existentes, normativa, múltiples departamentos)
- Áreas: Tecnología, Legal/Normativo, Operaciones

**Pregunta necesaria:** "¿Cuándo necesitas tener el sistema operativo?"

**Riesgos iniciales detectados:** Dependencias con sistemas del ayuntamiento no confirmadas; normativa puede limitar automatización

---

### Ejemplo 3 — Lanzamiento de SaaS

**Petición del usuario:**
> "Ayúdame a lanzar mi SaaS de gestión de inventario para pymes. Necesito tenerlo live para el 1 de septiembre"

**Interpretación:**
- Nombre inferido: `Lanzamiento SaaS Gestión de Inventario`
- Objetivo: Lanzar la plataforma SaaS en producción con primeros clientes antes del 2026-09-01
- Tipo: Lanzamiento + SaaS
- Prioridad: P1 (fecha concreta y comprometida)
- Deadline: 2026-09-01
- Complejidad: Alta
- Áreas: Producto, Desarrollo, Marketing, Ventas

**Suficiente información: iniciar directamente sin preguntas adicionales.**

**Riesgos iniciales:** 16 semanas disponibles — revisar si el producto ya está desarrollado o aún en construcción

---

### Ejemplo 4 — Organizar reforma

**Petición del usuario:**
> "Quiero organizar la reforma integral de mi apartamento. Empezamos en junio"

**Interpretación:**
- Nombre inferido: `Reforma Integral Apartamento`
- Objetivo: Completar la reforma integral del apartamento con todos los gremios coordinados
- Tipo: Reforma / Construcción
- Prioridad: P2
- Deadline: TBD (inicio en junio, duración por estimar)
- Complejidad: Alta
- Áreas: Arquitectura/Diseño, Contratistas, Presupuesto, Permisos

**Pregunta necesaria:** "¿Tienes una fecha límite para terminar la reforma, o solo sabes que empieza en junio?"

---

### Ejemplo 5 — Proyecto inmobiliario

**Petición del usuario:**
> "Crea un proyecto para gestionar la compra de un inmueble para inversión. Ya tenemos identificadas 3 propiedades"

**Interpretación:**
- Nombre inferido: `Inversión Inmobiliaria — Análisis y Compra`
- Objetivo: Evaluar las 3 propiedades identificadas y cerrar la compra de la más conveniente
- Tipo: Inmobiliario
- Prioridad: P2
- Deadline: TBD
- Complejidad: Media (proceso estructurado, actores externos: notaría, banco, vendedor)
- Áreas: Análisis financiero, Legal, Negociación

**Suficiente información: iniciar directamente.**

**Riesgos iniciales:** Dependencias con banco (financiación), notaría y vendedor — tiempos no controlados

---

## Criterios de Calidad del Agente

El `project_manager_agent` aplica correctamente esta directive cuando:

- [ ] No hace más de 2 preguntas antes de crear
- [ ] Infiere nombre, objetivo y tipo sin pedir confirmación en casos evidentes
- [ ] Detecta y registra al menos 1 riesgo si el contexto lo justifica
- [ ] Crea el proyecto en menos de 2 turnos de conversación
- [ ] El resumen de confirmación es de 3-4 líneas — no más
- [ ] No pide información que puede agregar después (stakeholders, herramientas, IDs de ClickUp)
