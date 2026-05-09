/**
 * token-crypto.ts — Encriptación AES-256-GCM para tokens OAuth de Google.
 *
 * Requiere GOOGLE_TOKEN_ENCRYPTION_KEY en .env (32 bytes en base64).
 * Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Si la clave no está configurada, almacena los tokens SIN encriptar (solo recomendado en dev).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96 bits — estándar para GCM
const TAG_LENGTH = 16  // 128 bits

export interface GoogleTokenData {
  access_token: string
  refresh_token: string
  expiry_date: number  // ms epoch
  token_type: string
  scope: string
}

/**
 * Encripta un objeto de tokens y devuelve un string base64 listo para almacenar en DB.
 * Formato: iv:tag:ciphertext (todos en hex, separados por ':')
 */
export function encryptTokens(tokens: GoogleTokenData): string {
  const key = getEncryptionKey()

  if (!key) {
    // Sin clave — almacenar como JSON base64 (no encriptado)
    return Buffer.from(JSON.stringify(tokens)).toString('base64')
  }

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plaintext = JSON.stringify(tokens)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

/**
 * Desencripta un string almacenado en DB y devuelve el objeto de tokens.
 */
export function decryptTokens(stored: string): GoogleTokenData {
  const key = getEncryptionKey()

  if (!key) {
    // Sin clave — leer como JSON base64
    return JSON.parse(Buffer.from(stored, 'base64').toString('utf8')) as GoogleTokenData
  }

  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Formato de token encriptado inválido.')

  const [ivHex, tagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encryptedBuf = Buffer.from(encryptedHex, 'hex')

  if (iv.length !== IV_LENGTH) throw new Error('IV inválido.')
  if (tag.length !== TAG_LENGTH) throw new Error('Auth tag inválido.')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()])

  return JSON.parse(decrypted.toString('utf8')) as GoogleTokenData
}

function getEncryptionKey(): Buffer | null {
  const keyB64 = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  if (!keyB64) return null
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY debe ser exactamente 32 bytes en base64.')
  }
  return key
}
