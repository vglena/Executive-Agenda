/**
 * server.ts — Servidor Node.js personalizado para Next.js.
 *
 * Necesario para node-cron (procesos persistentes en background).
 * Railway ejecuta este archivo en lugar del servidor estándar de Next.js.
 *
 * Arranque: node server.ts (en producción vía Railway)
 *           ts-node server.ts (en desarrollo)
 */

import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initScheduler } from './lib/services/scheduler.service'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, () => {
    console.log(`[server] Ready on http://${hostname}:${port} (${dev ? 'dev' : 'prod'})`)

    // Inicializar cron jobs después de que el servidor esté listo
    initScheduler()
  })
})
