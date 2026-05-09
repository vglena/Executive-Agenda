import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { signToken } from '@/lib/auth/jwt'
import { loginRateLimiter } from '@/lib/security/rate-limit'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  // ── Rate limiting — 10 intentos por IP cada 15 min ──────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = loginRateLimiter.check(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // Parsear y validar body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido.' }, { status: 400 })
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 })
  }

  const { email, password } = parsed.data

  // Verificar email
  const expectedEmail = process.env.EXECUTIVE_EMAIL
  // Hash almacenado en base64 para evitar problemas con $ en dotenv-expand
  const passwordHashB64 = process.env.EXECUTIVE_PASSWORD_HASH

  if (!expectedEmail || !passwordHashB64) {
    console.error('[auth/login] EXECUTIVE_EMAIL o EXECUTIVE_PASSWORD_HASH no configurados.')
    return NextResponse.json({ error: 'Servicio de autenticación no disponible.' }, { status: 503 })
  }

  let passwordHash: string
  try {
    passwordHash = Buffer.from(passwordHashB64, 'base64').toString('utf-8')
  } catch {
    console.error('[auth/login] EXECUTIVE_PASSWORD_HASH no es un base64 válido.')
    return NextResponse.json({ error: 'Servicio de autenticación no disponible.' }, { status: 503 })
  }

  // Comparación con tiempo constante — evita timing attacks
  const emailMatch = email.toLowerCase() === expectedEmail.toLowerCase()
  const passwordMatch = await compare(password, passwordHash)

  if (!emailMatch || !passwordMatch) {
    // Mismo mensaje para email incorrecto o contraseña incorrecta — evita enumeración
    return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 })
  }

  // Generar JWT
  const token = await signToken({ email: expectedEmail, role: 'executive' })

  return NextResponse.json({ token }, { status: 200 })
}
