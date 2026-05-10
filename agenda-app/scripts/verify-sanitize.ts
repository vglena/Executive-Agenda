/**
 * verify-sanitize.ts — Tests anti-XSS para sanitizeLLMText()
 *
 * Verifica que el helper sanitizeLLMText() elimina correctamente
 * contenido peligroso del output de LLMs antes de renderizarlo.
 *
 * Uso: tsx scripts/verify-sanitize.ts
 */

import { sanitizeLLMText } from '../lib/security/sanitize'

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}`)
    failures.push(label)
    failed++
  }
}

function notContains(output: string, substring: string, label: string): void {
  assert(!output.includes(substring), label)
}

function contains(output: string, substring: string, label: string): void {
  assert(output.includes(substring), label)
}

console.log('\n🔒 sanitizeLLMText — Tests anti-XSS\n')

// ─── A. Script tag con contenido ─────────────────────────────────────────────
console.log('A. Bloques <script> completos')
{
  const input = '<script>alert("xss")</script>Título legítimo'
  const out = sanitizeLLMText(input)
  notContains(out, '<script>', 'elimina tag <script>')
  notContains(out, 'alert("xss")', 'elimina contenido del script')
  contains(out, 'Título legítimo', 'preserva texto legítimo tras el bloque')
}

// ─── B. Script inline sin cierre limpio ──────────────────────────────────────
console.log('\nB. alert() en texto plano (sin tags)')
{
  const input = 'alert("xss")Reunión con el equipo'
  const out = sanitizeLLMText(input)
  notContains(out, 'alert(', 'elimina llamada alert()')
  contains(out, 'Reunión con el equipo', 'preserva texto legítimo posterior')
}

// ─── C. Event handlers en HTML ───────────────────────────────────────────────
console.log('\nC. Event handlers inline')
{
  const input = '<img src="x" onerror="alert(1)">texto seguro'
  const out = sanitizeLLMText(input)
  notContains(out, 'onerror', 'elimina onerror')
  notContains(out, 'alert(', 'elimina alert dentro del handler')
  contains(out, 'texto seguro', 'preserva texto seguro')
}

// ─── D. Protocolo javascript: ────────────────────────────────────────────────
console.log('\nD. Protocolo javascript:')
{
  const input = 'Revisa esto: javascript:alert(document.cookie)'
  const out = sanitizeLLMText(input)
  notContains(out, 'javascript:', 'elimina javascript:')
  notContains(out, 'document.cookie', 'elimina document.cookie')
}

// ─── E. eval() ───────────────────────────────────────────────────────────────
console.log('\nE. eval()')
{
  const input = 'eval(atob("YWxlcnQoMSk="))'
  const out = sanitizeLLMText(input)
  notContains(out, 'eval(', 'elimina eval()')
}

// ─── F. Bloque <style> completo ──────────────────────────────────────────────
console.log('\nF. Bloques <style>')
{
  const input = '<style>body{display:none}</style>Contenido del briefing'
  const out = sanitizeLLMText(input)
  notContains(out, '<style>', 'elimina tag <style>')
  notContains(out, 'display:none', 'elimina contenido de <style>')
  contains(out, 'Contenido del briefing', 'preserva texto posterior')
}

// ─── G. Comentarios HTML ─────────────────────────────────────────────────────
console.log('\nG. Comentarios HTML')
{
  const input = '<!-- <script>alert(1)</script> -->Texto visible'
  const out = sanitizeLLMText(input)
  notContains(out, '<!--', 'elimina apertura de comentario')
  notContains(out, 'alert(', 'elimina contenido del comentario')
  contains(out, 'Texto visible', 'preserva texto tras el comentario')
}

// ─── H. Preservación de estructura markdown ───────────────────────────────────
console.log('\nH. Preservación de markdown ## (estructura del briefing)')
{
  const input = '## Reuniones del día\nReunión con finanzas a las 10:00.\n\n## Foco operativo\nCerrar propuesta cliente.'
  const out = sanitizeLLMText(input)
  contains(out, '## Reuniones del día', 'preserva encabezado ## Reuniones')
  contains(out, '## Foco operativo', 'preserva encabezado ## Foco operativo')
  contains(out, 'Reunión con finanzas', 'preserva texto de reunión')
  contains(out, 'Cerrar propuesta cliente', 'preserva texto de foco')
}

// ─── I. Texto ejecutivo limpio pasa intacto ───────────────────────────────────
console.log('\nI. Texto limpio pasa sin modificación material')
{
  const input = 'Hoy tienes 3 reuniones. Prioriza cerrar el contrato antes de las 18:00.'
  const out = sanitizeLLMText(input)
  contains(out, 'Hoy tienes 3 reuniones', 'preserva texto de reuniones')
  contains(out, 'Prioriza cerrar el contrato', 'preserva recomendación ejecutiva')
}

// ─── J. XSS mixto real (payload combinado) ────────────────────────────────────
console.log('\nJ. Payload XSS combinado real')
{
  const input = '<script>alert("xss")</script>Título legítimo<img src=x onerror=alert(1)>'
  const out = sanitizeLLMText(input)
  notContains(out, '<script>', 'elimina <script>')
  notContains(out, 'alert(', 'elimina alert()')
  notContains(out, 'onerror', 'elimina onerror')
  notContains(out, '<img', 'elimina <img>')
  contains(out, 'Título legítimo', 'preserva texto legítimo')
}

// ─── K. window.location ──────────────────────────────────────────────────────
console.log('\nK. window.location')
{
  const input = 'window.location = "https://evil.com"'
  const out = sanitizeLLMText(input)
  notContains(out, 'window.location', 'elimina window.location')
}

// ─── L. Input vacío y tipos no-string ────────────────────────────────────────
console.log('\nL. Edge cases: input vacío / nulo')
{
  assert(sanitizeLLMText('') === '', 'string vacío devuelve vacío')
  // @ts-expect-error — test intencional de runtime
  assert(sanitizeLLMText(null) === '', 'null devuelve vacío')
  // @ts-expect-error — test intencional de runtime
  assert(sanitizeLLMText(undefined) === '', 'undefined devuelve vacío')
}

// ─── Resultado ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`Resultado: ${passed} pasados, ${failed} fallados`)

if (failures.length > 0) {
  console.log('\nFallados:')
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\n✅ Todos los tests anti-XSS pasaron.')
  process.exit(0)
}
