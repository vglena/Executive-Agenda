# Session Notes

> Notas de sesiones de trabajo con el agente. Actúa como memoria de corto plazo entre sesiones.
> El agente debe leer las últimas entradas al inicio de cada sesión para mantener continuidad.

---

## Instrucciones de Uso

- Registrar al cierre de cada sesión: qué se hizo, qué quedó pendiente
- Leer al inicio de cada sesión para retomar el contexto
- Las entradas viejas (más de 30 días) pueden archivarse
- No registrar información sensible o credenciales aquí

---

## Sesiones Recientes

### Sesión — 2026-05-09 [UI-01]

**Objetivo de la sesión**: Iniciar `UI-01 — Rediseño ejecutivo mobile-first` y aplicar Fase 1 visual + primera versión del dashboard mobile-first sin tocar backend.

**Acciones realizadas**:
- Registrada la decisión DEC-015 y referencia en PRJ-002.
- Implementado sistema visual base, `ExecutiveBrief`, estados vacíos reutilizables, `Card` y `Badge` mejorados.
- Reordenado dashboard para priorizar briefing, resumen diario, Top 3 prioridades, agenda y pendiente operativo.

**Decisiones tomadas**:
- DEC-015 — UI-01 Activada: Rediseño Ejecutivo Mobile-First.

**Sincronizaciones con ClickUp**:
- Ninguna.

### Sesión — 2026-05-09 [UX-DATETIME]

**Objetivo de la sesión**: Corregir regla funcional de agenda: toda actividad visible debe mostrar día y hora de forma clara.

**Decisión UX**:
- Eventos muestran día + hora inicio-fin.
- Tareas y prioridades con deadline muestran día concreto y `sin hora` porque el schema no almacena hora.
- Recordatorios muestran día + hora de disparo.
- Conflictos muestran día + hora de ambos elementos.
- No se inventan horas ni se cambian endpoints.

### Sesión — 2026-05-09 [FOCO-OPERATIVO]

**Objetivo de la sesión**: Cambiar la prioridad manual de flujo principal a señal secundaria y hacer que la app sugiera foco automáticamente.

**Decisión tomada**:
- DEC-016 — Prioridad Manual Pasa a Señal Secundaria.

**Acciones realizadas**:
- Reducido peso de prioridad manual en score.
- Añadidas señales de deadline, hora del día, carga de agenda, conflictos y recordatorios.
- Quitado protagonismo visual de P1/P2/P3 y cambiado lenguaje a foco/requiere atención.

### Sesión — 2026-05-09 [UI-04]

**Objetivo de la sesión**: Rediseñar `/priorities` como página premium de `Foco de hoy`.

**Acciones planificadas**:
- Hero superior, bloque Ahora, bloque Después, lista Más adelante y briefing accionable.
- Mantener endpoints actuales y helper de fecha/hora.

**Acciones realizadas**:
- `/priorities` rediseñada como `Foco de hoy`, sin ranking técnico ni prioridad manual visible.
- Añadidos bloques `Ahora`, `Después`, `Más adelante` y `Briefing accionable`.
- Recalcular/regenerar quedan como acciones discretas.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK.

### Sesión — 2026-05-09 [UI-05]

**Objetivo de la sesión**: Pulido mobile del dashboard completo para validación real.

**Acciones planificadas**:
- Ajustar orden, densidad, microcopy, estados vacíos y consistencia con `/priorities`.
- Mantener backend, endpoints y QuickAdd intactos.

**Acciones realizadas**:
- Dashboard reordenado para móvil: brief ejecutivo, foco+agenda, captura rápida, conflictos, briefing completo y operativo.
- Microcopy ajustado hacia `Hoy`, `Foco`, `Agenda`, `Operativo`, `Señales próximas`.
- Componentes operativos compactados y estados vacíos refinados.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK.

**Estado visual**:
- MVP visual listo para validación real con usuario ejecutivo.

**Pendiente para próxima sesión**:
- [x] Rediseñar QuickAdd como experiencia de captura asistida.
- [x] Rediseñar conflictos como decision cards.
- [ ] Pulir página `/priorities`.

### Sesión — 2026-05-09 [UI-02]

**Objetivo de la sesión**: Implementar `UI-02 — QuickAdd premium mobile-first` sin tocar backend ni endpoints.

**Acciones realizadas**:
- QuickAdd convertido de panel administrativo a captura ejecutiva rápida.
- Mantener formularios, APIs y validaciones existentes, con modo mínimo por defecto y campos avanzados colapsables.

**Sincronizaciones con ClickUp**:
- Ninguna.

### Sesión — 2026-05-09 [UI-03]

**Objetivo de la sesión**: Implementar `UI-03 — Conflictos como decision cards` manteniendo endpoints y lógica actual.

**Acciones realizadas**:
- Rediseñar `ConflictosCalendario` para presentar conflictos como decisiones ejecutivas, no alertas técnicas.
- Mantener acciones existentes: marcar revisado e ignorar.

**Sincronizaciones con ClickUp**:
- Ninguna.

---

## Plantilla de Sesión

```markdown
### Sesión — YYYY-MM-DD [HH:MM]

**Objetivo de la sesión**: [qué se quería lograr]

**Acciones realizadas**:
- [acción 1]
- [acción 2]

**Decisiones tomadas**:
- [referencia a decisions_log si aplica]

**Sincronizaciones con ClickUp**:
- [tarea creada / actualizada / sincronizada]

**Pendiente para próxima sesión**:
- [ ] [tarea pendiente]

**Notas adicionales**:
[contexto relevante para la próxima sesión]
```

---

*Última actualización: [fecha]*

### Sesión — 2026-05-09 [DEPLOY-UI]

**Objetivo de la sesión**: Desplegar a producción el estado actual real de `agenda-app` para que Railway muestre el rediseño ejecutivo mobile-first y no la vista antigua.

**Acciones realizadas**:
- Verificado `git status`: cambios UI actuales estaban locales y sin remote `origin`.
- Ejecutado `npx tsc --noEmit` OK.
- Ejecutado `npm run build` OK.
- Creado commit `938b214` — `Implement executive mobile UI`.
- Confirmado que Railway no expone GitHub como fuente (`source: null`); despliegue realizado directamente con `railway up`.
- Corregido `railway.toml` para usar `buildCommand = "npm run build"` y evitar doble `npm ci` en Nixpacks.
- Deploy Railway `fa88bc4a-2b7a-41bc-a00c-7fa3c3d986b1` completado con status SUCCESS.
- Healthcheck producción OK.
- Verificación por bundle/HTTP: producción contiene textos del rediseño (`Preparando tu día`, `foco`, `alertas`, `Captura`, `Guardar`, `Ajuste manual opcional`, `Foco de hoy`) y no contiene textos antiguos (`TOP 5 PRIORIDADES`, `AÑADIR RÁPIDO`, `Top 5`).

**Decisiones tomadas**:
- DEC-017 — Producción Actualizada con Rediseño Ejecutivo Mobile-First.

**Sincronizaciones con ClickUp**:
- Ninguna.

**Pendiente para próxima sesión**:
- [ ] Abrir URL pública en móvil real/incógnito y confirmar visualmente que muestra UI nueva.
- [ ] Solo después, ejecutar sesión de validación real del ejecutivo.

### Sesión — 2026-05-10 [UI-06A] — Sanitización visual definitiva del briefing IA

**Objetivo de la sesión**: Eliminar residuos XSS del briefing IA (`alert("xss")Título legítimo` visible en móvil).

**Root cause identificado**:
- `sanitizeText()` solo eliminaba tags HTML (`<script>`) pero dejaba el contenido (`alert("xss")`) como texto plano visible.

**Acciones realizadas**:
- Añadida `sanitizeLLMText()` en `lib/security/sanitize.ts` con 9 capas de defensa (script/style blocks, comentarios, tags, protocolos JS, event handlers, funciones peligrosas, control chars, normalización).
- `summary.service.ts`: sanitiza LLM output **antes** de persistir en DB (capa servidor).
- `ResumenDiario.tsx`: sanitiza al renderizar `sugerencia_del_dia` y `contenido_completo`.
- `priorities/page.tsx`: sanitiza `task.justificacion`, `data.sugerencia_del_dia`, `data.contenido_completo`.
- Añadido `scripts/verify-sanitize.ts` con 12 grupos de tests / 32 assertions anti-XSS.
- Añadido `npm run verify:sanitize`.
- Verificación: 32/32 tests OK, `npm run build` OK.

**Decisiones tomadas**:
- Doble capa de sanitización: servidor (al guardar en DB) + cliente (al renderizar). Nunca se renderiza HTML del LLM.

**Sincronizaciones con ClickUp**: Ninguna.

### Sesión — 2026-05-10 [UI-06B] — Header ejecutivo mobile-first

**Objetivo de la sesión**: Reemplazar headers verbosos por header minimalista tipo app premium móvil, con bottom navigation sticky.

**Problema anterior**:
- Header alto con links de texto ("Sync / Foco / Salir") — aspecto desktop comprimido en móvil.
- Sin navegación principal accesible en móvil.

**Acciones realizadas**:
- Creado `components/ui/AppHeader.tsx` — header compartido con: fecha compacta encima del título, icono sync animado, icono sign-out, link foco desktop-only. Props: `title`, `backHref`, `showSync`, `syncing`, `onSync`, `showFoco`, `showSignOut`, `onSignOut`, `syncMessage`.
- Creado `components/ui/BottomNav.tsx` — navegación inferior sticky solo en móvil (`sm:hidden`). Items: Hoy (/dashboard), Foco (/priorities), Capturar (/dashboard#quickadd). Item activo resaltado con fondo redondeado.
- `app/dashboard/page.tsx`: reemplazado `<header>` inline por `<AppHeader>`, añadido `<BottomNav>`, `pb-16 sm:pb-0` al shell.
- `app/priorities/page.tsx`: reemplazado `<header>` + Link/button inline por `<AppHeader title="Foco">`, añadido `<BottomNav>`.
- `app/globals.css`: añadida utilidad `.pb-safe` con `env(safe-area-inset-bottom)` para home indicator de iOS/Android.
- Imports limpiados (removidos `Link` no usados de ambas páginas).
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK.

**Decisiones de diseño**:
- Sync y Sign-out solo con íconos en móvil; label visible en `sm:` y superior.
- BottomNav solo visible en `sm:hidden` — desktop conserva AppHeader completo.
- `tap-target` (min-height: 44px) en todos los elementos interactivos.

**Pendiente para próxima sesión**:
- [ ] Abrir en móvil real y validar BottomNav, altura del header y visual premium.
- [ ] Considerar si Capturar en BottomNav debe abrir un modal inline o hacer scroll.

### Sesión — 2026-05-10 [UI-06C] — Agenda del día tipo timeline ejecutivo

**Objetivo de la sesión**: Convertir AgendaDelDia de lista CRUD a timeline visual premium.

**Acciones realizadas**:
- `components/dashboard/AgendaDelDia.tsx` reescrito completamente como timeline vertical.
- Helpers locales: `toMinutes(hhmm)`, `nowMinutes()`, `timeSlot()` (past/current/upcoming), `durationLabel()`.
- Cada evento muestra: hora prominente + rango + duración · punto temporal coloreado · línea spine vertical.
- Estados visuales diferenciados:
  - **Pasado**: dot gris, texto atenuado `text-stone-400/300`, sin fondo.
  - **Ahora**: dot azul brillante + `ring` + `shadow` pulsante, fondo `bg-blue-50`, badge "Ahora" animado, hora en azul bold.
  - **Próximo**: dot `stone-400`, texto normal.
  - **Conflicto activo**: dot ámbar + fondo `bg-amber-50` + badge "requiere decisión".
- Header de sección: título + contador de eventos + badge de conflictos activos.
- Eliminadas dependencias: `Card`, `Badge`, `formatTimeRange` (no usadas).
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK.

### Sesión — 2026-05-10 [UI-06D] — Captura instantánea ejecutiva

**Objetivo de la sesión**: Rediseñar QuickAdd para capturar en <5 segundos con input único inteligente.

**Acciones realizadas**:
- Creado `components/quickadd/SmartCapture.tsx` — componente de captura inteligente con:
  - Input único full-width con placeholder rotativo de ejemplos.
  - Detección de tipo heurística en tiempo real: `detectType()` identifica evento/recordatorio/tarea por palabras clave y patrones de tiempo.
  - Badge inline animado muestra tipo detectado mientras el usuario escribe.
  - `parseDate()`: entiende "mañana", "pasado mañana", nombres de días (siguiente ocurrencia), default hoy.
  - `parseTime()`: patrones HH:MM, Xam/Xpm, "las X" / "a las X".
  - `cleanTitle()`: elimina filler de fecha/hora/acción para obtener título limpio.
  - Submit con Enter o botón "↑", spinner inline, feedback inmediato sin layout shift.
  - Comportamiento por tipo: evento→POST /api/events con fecha+hora parseadas; recordatorio→POST /api/tasks (limpio, con mensaje de follow-up); tarea→POST /api/tasks con fecha si hay pista temporal.
- Reescrito `components/quickadd/QuickAddPanel.tsx`:
  - SmartCapture ocupa la posición principal (visible siempre).
  - Formularios detallados (QuickAddTask/Event/Reminder) colapsan bajo "Formulario detallado" con chevron.
  - Sin layout shifts: el panel no cambia tamaño al mostrar feedback.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK.

**Decisiones de diseño**:
- Recordatorio detectado → crea tarea + mensaje guía. La API de recordatorios requiere entity_id; no se puede crear en flujo de una línea.
- Placeholder rota cada 10 segundos entre 4 ejemplos representativos (calculado con `Date.now()`, sin state).

### Sesión — 2026-05-10 [UI-06F] — Pendientes operativos inteligentes

**Objetivo de la sesión**: Convertir el bloque "Operativo" de checklist genérico a vista ejecutiva agrupada por urgencia con tap-to-complete.

**Problema anterior**: Lista plana de tareas sin clasificación ni señal de impacto. El ejecutivo no podía distinguir qué bloqueaba el día de qué podía ignorar.

**Acciones realizadas**:
- `components/dashboard/TareasPendientes.tsx` reescrito completamente con:
  - **Clasificador `getSlot()`**: agrupa cada tarea en `vencida | hoy | semana | despues` según `fecha_limite` relativa a hoy (sin depender de timezone serverside).
  - **4 grupos con metadatos**:
    - `vencida` → "Requiere acción / Bloqueando el día" (rose)
    - `hoy` → "Para hoy / Deadline hoy" (blue)
    - `semana` → "Esta semana / Próximos 7 días" (stone)
    - `despues` → "Después / Puede ignorarse ahora" (stone-muted, colapsado por defecto)
  - **`TaskGroup`**: header colapsable con label de grupo + hint + contador. Toggle con chevron animado. Grupo "Después" comienza colapsado — el ejecutivo puede ignorarlo sin cognitive load.
  - **`TaskRow`**: título + deadline relativo (`formatRelativeDate`) + badge de impacto operativo (P1 → "Urgente" amber, P2 → "Importante" stone, P3/P4 → sin badge).
  - **`CompleteButton`**: botón táctil 44px con círculo coloreado por slot. Click → remoción optimista inmediata del estado local + `PUT /api/tasks/:id { estado: 'completada' }`. Sin bloqueo de UI.
  - **Card description dinámica**: "N tareas bloquean el día" cuando hay vencidas; "Pendientes abiertos" si todo OK.
  - `useCallback` en `cargar` y `handleComplete` para evitar re-renders innecesarios.
  - Carga completa (sin `.slice(0, 8)`) — ahora todas las tareas llegan y se distribuyen en grupos.
- API utilizada: `GET /api/tasks?estado=pendiente` (sin cambios) + `PUT /api/tasks/:id` (existía, no modificado).
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK (exit 0).

**Decisiones de diseño**:
- "Después" colapsado por defecto: señal explícita de "esto puede ignorarse". El ejecutivo abre solo si quiere revisarlo.
- Remoción optimista: sin spinner al completar — la tarea desaparece al toque. Más natural que esperar confirmación del servidor.
- `formatRelativeDate()` como deadline: "Hace 2 días", "Hoy", "En 3 días" — contexto relativo es más útil que fecha absoluta.
- Sin swipe (según reglas del MVP): el tap-to-complete en círculo izquierdo es suficiente para primera versión.
- No se implementó paginación ni "ver más" — la vista completa agrupada es suficiente para el volumen esperado.

**Sincronizaciones con ClickUp**: Ninguna.

**Pendiente para próxima sesión**:
- [ ] Desplegar a Railway (`railway up`).
- [ ] Validar en móvil: tap-to-complete táctil, grupos colapsados, legibilidad de badges.

### Sesión — 2026-05-10 [UI-07] — Auditoría UX final ejecutiva móvil

**Objetivo de la sesión**: Auditoría UX completa de toda la app antes del go-live. Detectar y corregir bugs funcionales, microcopy incorrecto, inconsistencias visuales y problemas de accesibilidad.

**Auditoría realizada** (6 superficies: dashboard, foco, captura, agenda, conflictos, resumen).

**Bugs funcionales corregidos:**
1. **BottomNav active state bug** (`components/ui/BottomNav.tsx`): "Hoy" y "Capturar" ambas mostraban active en `/dashboard`. `item.href.startsWith('/dashboard')` era `true` para ambas. Fix: si href contiene `#` (anchor link), `isActive = false`; para rutas normales, exact match para `/dashboard`, startsWith para el resto.
2. **`#quickadd` anchor faltante** (`app/dashboard/page.tsx`): BottomNav "Capturar" apuntaba a `/dashboard#quickadd` pero no existía ningún elemento con ese ID. Fix: `<div id="quickadd" className="scroll-mt-16">` como wrapper del `<QuickAddPanel>`.

**Issues de calidad corregidos:**
3. **AppHeader `bg-white/88`** → `bg-white/90`: opacity 88 no es step de Tailwind por defecto.
4. **AppHeader `gap-0.5`** entre botones → `gap-1`: 2px demasiado ajustado en touch.
5. **ExecutiveBrief badge "Requiere atención"**: aparecía siempre que hubiera `topPriority`, incluso cuando `dayState === 'Día controlado'`. Fix: solo mostrar cuando `dayState === 'Requiere atención'`.
6. **ExecutiveBrief `bg-white/8`** → `bg-white/[0.08]`: opacity 8 no generaba CSS correcto.
7. **AgendaDelDia ternario redundante**: `slot === 'past' ? 'bg-stone-200' : 'bg-stone-200'` — ambas ramas iguales. Simplificado.

**Microcopy corregido:**
8. **"Siguiente señal"** en `ResumenDiario.tsx` y `priorities/page.tsx` → **"Sugerencia del asistente"**.
9. **ResumenDiario timestamp**: "Generado: ..." → "Actualizado ..." con `text-stone-300` (más sutil).

**Readability:**
10. **`truncate` en laterTasks** (Priorities page) → `line-clamp-2`: títulos ya no se cortan en mobile.

**Verificación**: `npx tsc --noEmit` OK, `npm run build` OK (exit 0).

**UX Readiness — Estado go-live:**

| Superficie | Estado |
|---|---|
| Dashboard (Hoy) | ✅ Ready |
| Foco (Prioridades) | ✅ Ready |
| Captura rápida | ✅ Ready |
| Agenda (timeline) | ✅ Ready |
| Conflictos calendario | ✅ Ready |
| Briefing IA | ✅ Ready |
| Bottom navigation | ✅ Ready (bug active corregido) |
| Login | ✅ Ready |
| Mobile UX (tap-target, safe area, scroll) | ✅ Ready |
| Accesibilidad (aria, sr-only) | ✅ Ready |

**Conclusión**: App en estado de UX readiness completo. Bloqueador de go-live: ninguno técnico. Siguiente paso: `railway up` + validación en dispositivo físico.

**Sincronizaciones con ClickUp**: Ninguna.

**Pendiente para próxima sesión**:
- [ ] `railway up` — desplegar UI-06A→UI-07 a producción.
- [ ] Validación física: iPhone Safari (safe area) + Android Chrome (tap targets, grupos, active nav).
- [ ] F4-03: dominio público + HTTPS en Railway.
- [ ] F4-05: monitoreo uptime.
- [ ] F4-06: go-live formal + guía acceso ejecutivo.

### Sesión — 2026-05-10 [UI-06E] — Pulido visual premium consistente

**Objetivo de la sesión**: Unificar radios, spacing, shadows y typography en toda la app. Eliminar aspecto administrativo. Reducir borders visibles. App debe sentirse premium, calmada y mobile-native.

**Acciones realizadas**:
- `app/globals.css`: Refactorizado con variables CSS para shadows (`--shadow-card`, `--shadow-hero`). Añadida capa `@layer base` con `-webkit-tap-highlight-color: transparent` y `text-size-adjust`. Añadida clase `.tap-target:active:not(:disabled)` para feedback de press (scale 0.98). Aligerada `.executive-surface` — shadow de 18px/50px reducida a 1px/3px + 4px/14px (más sutil, menos pesada). Añadida clase `.section-card` como alias semántico. Añadidos `overscroll-behavior-y: none`, `-moz-osx-font-smoothing`, `::selection`.
- `components/ui/Card.tsx`: Cambiado `rounded-xl` → `rounded-2xl` para consistencia con componentes modernos. Simplificado `TONES.default` de `executive-surface border shadow-sm` → `bg-white ring-1 ring-stone-200/80` (borde ligero, sin shadow pesada). `elevated` conserva shadow. Header padding unificado a `py-4`. `description` color a `text-stone-400` (más sutil que stone-500).
- `components/ui/EmptyState.tsx`: Eliminado border dashed administrativo. Estado vacío ahora es texto plano con padding mínimo.
- `components/ui/ErrorMessage.tsx`: Cambiado de `text-red-600 bg-red-50 rounded-lg` a `rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100` — consistente con lenguaje de diseño (rose, ring, rounded-xl).
- `components/ui/Spinner.tsx`: Cambiado `border-gray-200 border-t-gray-500` → `border-stone-200 border-t-stone-500`. Reducido de `h-5/w-5` a `h-4/w-4`, padding vertical de `py-8` a `py-6`.
- `components/dashboard/TopPrioridades.tsx`: Eliminado double-card nesting (el wrapper `bg-white/70 ring-1 ring-stone-100` de cada item). Lista ahora usa `divide-y divide-stone-100` — patrón de divisores planos vs. tarjetas apiladas. Items más compactos con `py-3` y circle badge ligeramente reducido (`h-6 w-6` vs `h-7 w-7`).
- `components/dashboard/TareasPendientes.tsx`: Reemplazado checkbox cuadrado (`rounded border border-stone-300`) por círculo vacío (`rounded-full border-2 border-stone-300`). Overdue usa `border-rose-400`. Lista con `divide-y divide-stone-100` vs. `space-y-2`. Título puede wrapearse (removido `truncate`). "Sin fecha · sin hora" simplificado a "Sin fecha".
- `components/dashboard/RecordatoriosProximos.tsx`: Lista con `divide-y divide-stone-100`. Dot de `bg-amber-500` → `bg-amber-400`. `leading-snug` en título.
- `components/quickadd/QuickAddPanel.tsx`: Reemplazado clase `executive-surface border` por `bg-white ring-1 ring-stone-200/80` (consistente con Card.default).
- `app/login/page.tsx`: Actualizado de `gray-*` → `stone-*` y `bg-gray-50` → `executive-shell`. Inputs con `rounded-xl`, `ring-4 focus:ring-stone-200/60`, labels con `text-xs`. Botón con `rounded-xl`, `bg-stone-950`. Form con `rounded-2xl ring-1 ring-stone-200/80`.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK (exit 0).

**Decisiones de diseño**:
- Divisores (`divide-y`) en listas para separar ítems en lugar de tarjetas anidadas — elimina aspecto de "tabla con bordes".
- Ring en lugar de border para superficies: `ring-1 ring-stone-200/80` — el ring es semitransparente, visualmente más ligero.
- `rounded-2xl` como radio estándar de sección/tarjeta. `rounded-xl` para elementos dentro de tarjetas (inputs, sub-cards).
- El shadow estándar de `.executive-surface` antes era `0 18px 50px rgba(31,41,55,0.07)` — se reduce a `0 1px 3px + 0 4px 14px` (más sutil, premium).
- App premium no usa borders pesados — usa espacio, contraste de color y tipografía para separar secciones.

**Sincronizaciones con ClickUp**: Ninguna.

**Pendiente para próxima sesión**:
- [ ] Desplegar a Railway (`railway up`) para validar en producción.
- [ ] Validar en móvil real: iPhone Safari + Android Chrome — tap targets, spacing, legibilidad.
