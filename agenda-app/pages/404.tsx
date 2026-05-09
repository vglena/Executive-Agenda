/**
 * Custom 404 page (Pages Router).
 * Overrides Next.js default _error so static generation of /404
 * does not depend on the broken built-in _error renderer.
 */
export default function Custom404() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: '#6b7280' }}>Página no encontrada</p>
    </div>
  )
}
