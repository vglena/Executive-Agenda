/**
 * Custom 500 page (Pages Router).
 * Overrides Next.js default _error so static generation of /500
 * does not depend on the broken built-in _error renderer.
 */
export default function Custom500() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>500</h1>
      <p style={{ color: '#6b7280' }}>Error interno del servidor</p>
    </div>
  )
}
