/**
 * google-oauth.ts — Helpers para el flujo OAuth 2.0 de Google Calendar.
 *
 * Variables de entorno requeridas:
 *   GOOGLE_CLIENT_ID      — Client ID de Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — Client Secret de Google Cloud Console
 *   GOOGLE_REDIRECT_URI   — URI de callback registrada en Google Cloud Console
 *
 * El sistema funciona sin estas variables (usa NullCalendarAdapter).
 */

import { google } from 'googleapis'
import { SignJWT, jwtVerify } from 'jose'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
]

/** Devuelve true si las credenciales de Google están configuradas */
export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  )
}

/** Crea y devuelve un cliente OAuth2 de Google */
export function createOAuth2Client() {
  if (!isGoogleConfigured()) {
    throw new Error('Google OAuth no configurado. Agrega GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI al .env.')
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

/**
 * Genera la URL de autorización de Google + un state firmado con JWT para prevenir CSRF.
 * El state expira en 10 minutos.
 */
export async function buildAuthUrl(): Promise<{ url: string; state: string }> {
  const oauth2Client = createOAuth2Client()
  const secret = getJwtSecret()

  const state = await new SignJWT({ purpose: 'google_oauth' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret)

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // fuerza la emisión de refresh_token en cada autorización
    state,
  })

  return { url, state }
}

/**
 * Verifica que el state del callback es un JWT válido emitido por este sistema.
 * Lanza si es inválido o expirado.
 */
export async function verifyOAuthState(state: string): Promise<void> {
  const secret = getJwtSecret()
  try {
    const { payload } = await jwtVerify(state, secret)
    if (payload['purpose'] !== 'google_oauth') {
      throw new Error('State inválido: purpose incorrecto.')
    }
  } catch {
    throw new Error('OAuth state inválido o expirado. Inicia el flujo nuevamente.')
  }
}

/**
 * Intercambia el código de autorización por access_token + refresh_token.
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google no devolvió access_token o refresh_token. Asegúrate de usar prompt=consent.')
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    token_type: tokens.token_type ?? 'Bearer',
    scope: tokens.scope ?? SCOPES.join(' '),
  }
}

/**
 * Revoca el access_token en Google (buena práctica al desconectar).
 * No lanza si el token ya expiró — el borrado local es suficiente.
 */
export async function revokeToken(accessToken: string): Promise<void> {
  try {
    const oauth2Client = createOAuth2Client()
    await oauth2Client.revokeToken(accessToken)
  } catch (err) {
    console.warn('[google-oauth] revokeToken falló (ignorado):', err)
  }
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado.')
  return new TextEncoder().encode(secret)
}
