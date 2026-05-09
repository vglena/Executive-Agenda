/**
 * scripts/gen-hash.ts — Genera el bcrypt hash de una contraseña para EXECUTIVE_PASSWORD_HASH.
 *
 * Uso:
 *   npx tsx scripts/gen-hash.ts "TuContraseñaAquí"
 *
 * Copia el hash resultante a EXECUTIVE_PASSWORD_HASH en .env
 */

import { hash } from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Uso: npx tsx scripts/gen-hash.ts "TuContraseña"')
  process.exit(1)
}

hash(password, 12).then((h) => {
  const b64 = Buffer.from(h).toString('base64')
  console.log('\nHash bcrypt (solo referencia):')
  console.log(h)
  console.log('\nCopia esto a EXECUTIVE_PASSWORD_HASH en .env.local:')
  console.log(b64)
  console.log()
})
