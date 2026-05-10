'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { setToken, getToken } from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Si ya tiene token, ir directo al dashboard
  useEffect(() => {
    if (getToken()) router.replace('/dashboard')
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión.')
        return
      }
      setToken(data.token as string)
      router.replace('/dashboard')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen executive-shell flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Agenda Ejecutiva</h1>
          <p className="mt-1 text-sm text-stone-400">Inicia sesión para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 ring-1 ring-stone-200/80 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-stone-500 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
              placeholder="ejecutivo@agenda.local"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-stone-500 mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="tap-target w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tap-target w-full justify-center rounded-xl bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </main>
  )
}
