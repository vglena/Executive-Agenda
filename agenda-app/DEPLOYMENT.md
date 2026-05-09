# Guía de Despliegue — Asistente IA de Agenda Ejecutiva

## Arquitectura de producción

```
Railway (servidor Node.js persistente)
  └── server.ts  →  Next.js App Router  +  node-cron scheduler
        └── Supabase PostgreSQL (pgbouncer:6543 + direct:5432)
```

**Por qué Railway (no Vercel):** el scheduler `node-cron` requiere un proceso Node.js persistente. Vercel usa funciones serverless sin estado persistente.

---

## Requisitos previos

- [ ] Cuenta en [Railway](https://railway.app) con plan Hobby o superior
- [ ] Proyecto en Supabase activo con migración `20260508202244_init` aplicada
- [ ] Repositorio en GitHub conectado a Railway

---

## Checklist de despliegue inicial

### 1. Preparar el repositorio

- [ ] `.env.local` está en `.gitignore` (confirmado — no se sube)
- [ ] `.env.example` contiene todas las variables (sin valores reales)
- [ ] `railway.toml` está en la raíz de `agenda-app/`
- [ ] `package.json` tiene `"start:prod": "prisma migrate deploy && tsx server.ts"`
- [ ] Código limpio: `npx tsc --noEmit` → 0 errores

### 2. Crear servicio en Railway

```
Railway Dashboard → New Project → Deploy from GitHub repo
  → Seleccionar repositorio
  → Root Directory: agenda-app   ← IMPORTANTE
```

### 3. Configurar variables de entorno en Railway

En Railway Dashboard → Variables, añadir:

| Variable | Valor | Obligatoria |
|---|---|---|
| `DATABASE_URL` | URL con pgbouncer (puerto 6543) | ✅ |
| `DIRECT_URL` | URL directa (puerto 5432) | ✅ |
| `JWT_SECRET` | base64 de 32 bytes aleatorios | ✅ |
| `EXECUTIVE_EMAIL` | email de acceso | ✅ |
| `EXECUTIVE_PASSWORD_HASH` | base64 del hash bcrypt | ✅ |
| `OPENAI_API_KEY` | `sk-...` | Opcional |
| `LLM_MODEL` | `gpt-4o-mini` | Opcional |
| `GOOGLE_CLIENT_ID` | — | Opcional |
| `GOOGLE_CLIENT_SECRET` | — | Opcional |
| `GOOGLE_REDIRECT_URI` | — | Opcional |
| `GOOGLE_REFRESH_TOKEN` | — | Opcional |
| `PRIORITY_WEIGHT_URGENCY` | `0.5` | Opcional |
| `PRIORITY_WEIGHT_IMPACT` | `0.3` | Opcional |
| `PRIORITY_WEIGHT_LOAD` | `0.2` | Opcional |

> **Nota:** Railway inyecta `PORT` y `NODE_ENV=production` automáticamente. No los añadas manualmente.

### 4. Verificar configuración de build

Railway detecta `railway.toml` automáticamente:
- **Build:** `npm ci && npm run build`  
  → `npm ci` instala deps + `postinstall` ejecuta `prisma generate`  
  → `next build` compila la aplicación
- **Start:** `npm run start:prod`  
  → `prisma migrate deploy` aplica migraciones pendientes  
  → `tsx server.ts` arranca Next.js + node-cron

### 5. Primer despliegue

- [ ] Push a rama `main` → Railway inicia build automáticamente
- [ ] Observar logs de build en Railway Dashboard
- [ ] Verificar que `prisma migrate deploy` no reporta errores
- [ ] Confirmar que el servidor arranca: `[server] Ready on http://...`
- [ ] Comprobar healthcheck: `GET https://[tu-dominio].railway.app/api/health`

**Respuesta esperada del healthcheck:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-09T...",
  "env": "production",
  "db": "ok"
}
```

### 6. Verificar login

```bash
curl -X POST https://[tu-dominio].railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ejecutivo@agenda.local","password":"Agenda2026!"}'
# → { "token": "eyJ..." }
```

### 7. Verificar scheduler en logs

En Railway → Logs, buscar al arranque:
```
[scheduler] Inicializando jobs...
[scheduler] Job registrado: reminders (cada minuto)
[scheduler] Job registrado: daily-generation (cada minuto)
[scheduler] Job registrado: calendar-sync (cada 15 minutos)
[scheduler] 3 jobs activos.
```

---

## Comandos de generación de credenciales

```powershell
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generar EXECUTIVE_PASSWORD_HASH para nueva contraseña
cd agenda-app
npm run gen:hash -- "NuevaContraseña"
# → copia el valor "Base64 para .env" a EXECUTIVE_PASSWORD_HASH en Railway
```

---

## Prueba local simulando producción

```powershell
cd agenda-app

# Windows PowerShell
$env:NODE_ENV = "production"
npm run start

# Verificar healthcheck local
Invoke-RestMethod http://localhost:3000/api/health
```

---

## Despliegues posteriores (actualizaciones)

1. Push a `main` → Railway redespliega automáticamente
2. Si hay nuevas migraciones Prisma: se aplican automáticamente en `start:prod`
3. Para cambiar contraseña: `npm run gen:hash -- "NuevaContraseña"` → actualizar `EXECUTIVE_PASSWORD_HASH` en Railway Variables → redeploy

---

## Rollback

En Railway Dashboard → Deployments → seleccionar despliegue anterior → Rollback.

---

## Notas de arquitectura

- **node-cron:** los 3 jobs (reminders, daily-generation, calendar-sync) se inician en `server.ts` después de que Next.js está listo. Railway mantiene el proceso vivo indefinidamente.
- **NullLLMAdapter:** si `OPENAI_API_KEY` no está configurada, el sistema genera justificaciones y resúmenes localmente. No falla.
- **NullCalendarAdapter:** si Google Calendar no está configurado, `syncCalendar()` es un no-op silencioso.
- **Migraciones:** `prisma migrate deploy` solo aplica migraciones pendientes; es idempotente y seguro en restart.
- **PgBouncer:** `DATABASE_URL` usa el pooler (puerto 6543) para conexiones de aplicación. `DIRECT_URL` usa conexión directa (puerto 5432) solo para migraciones.
