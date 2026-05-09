/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security headers — aplicados a todas las rutas ──────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que el browser infiera el MIME type incorrecto
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Impide embedding en iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Política de referrer conservadora
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desactiva características de browser no usadas
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy — MVP: solo same-origin + googleapis para OAuth
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js necesita unsafe-eval en dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com",
              "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // HSTS — solo en producción (no forzar en localhost)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
            : []),
        ],
      },
      // ── CORS — solo para rutas API ─────────────────────────────────────────
      {
        source: '/api/(.*)',
        headers: [
          // MVP: cliente en mismo origen. Si se despliega en dominio diferente, actualizar aquí.
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN ?? 'same-origin' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
}

export default nextConfig;

