/**
 * conflict.service.ts — F3-03: Detección y gestión de conflictos de calendario
 *
 * Filosofía:
 *  - Detecta solapamientos horarios entre eventos de Google y eventos manuales.
 *  - NUNCA borra ni modifica eventos. Solo registra el conflicto.
 *  - No resuelve automáticamente. El usuario decide.
 *  - El registro de conflictos sobrevive al sync — son datos del usuario.
 */

import { prisma } from '@/lib/db'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface ConflictoEvento {
  id: string
  titulo: string
  fecha: string           // "YYYY-MM-DD"
  hora_inicio: string     // "HH:MM"
  hora_fin: string        // "HH:MM"
  descripcion: string | null
  origen: string
}

export interface ConflictoDetalle {
  id: string
  estado: string          // "pendiente" | "revisado" | "ignorado"
  nota: string | null
  detected_at: string     // ISO
  resolved_at: string | null
  evento_google: ConflictoEvento
  evento_manual: ConflictoEvento
}

// ── detectAndSaveConflicts ─────────────────────────────────────────────────

/**
 * Detecta solapamientos entre un evento de Google y los eventos manuales del
 * mismo día. Crea registros Conflict para los nuevos solapamientos.
 *
 * Se llama al crear o actualizar un evento de Google en el sync.
 *
 * @returns { conflicto: boolean, nuevos: number }
 */
export async function detectAndSaveConflicts(
  googleEventId: string,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
): Promise<{ conflicto: boolean; nuevos: number }> {
  // Buscar eventos manuales activos en el mismo día con solapamiento
  const candidatos = await prisma.event.findMany({
    where: {
      fecha,
      estado: 'activo',
      origen: 'manual',
      id: { not: googleEventId },
    },
    select: { id: true, hora_inicio: true, hora_fin: true },
  })

  // Filtrar por solapamiento: [A_ini, A_fin) ∩ [B_ini, B_fin) ≠ ∅
  const solapados = candidatos.filter(
    (c) => horaInicio < c.hora_fin && horaFin > c.hora_inicio,
  )

  if (solapados.length === 0) {
    return { conflicto: false, nuevos: 0 }
  }

  // Crear Conflict para cada solapamiento nuevo (upsert → no duplicados por @@unique)
  let nuevos = 0
  for (const manual of solapados) {
    try {
      await prisma.conflict.create({
        data: {
          evento_google_id: googleEventId,
          evento_manual_id: manual.id,
          estado: 'pendiente',
        },
      })
      nuevos++
    } catch {
      // @@unique violation → el conflicto ya existe; actualizamos a pendiente si estaba ignorado
      await prisma.conflict.updateMany({
        where: {
          evento_google_id: googleEventId,
          evento_manual_id: manual.id,
          estado: 'ignorado',
        },
        data: { estado: 'pendiente', resolved_at: null, nota: null },
      })
    }
  }

  return { conflicto: true, nuevos }
}

// ── getConflicts ───────────────────────────────────────────────────────────

/**
 * Devuelve conflictos con detalle de ambos eventos.
 * Por defecto solo devuelve "pendiente". Con incluirResueltos=true también devuelve
 * "revisado" e "ignorado" de los últimos 30 días.
 */
export async function getConflicts(
  incluirResueltos = false,
): Promise<ConflictoDetalle[]> {
  const estadoFiltro = incluirResueltos
    ? { in: ['pendiente', 'revisado', 'ignorado'] }
    : { equals: 'pendiente' }

  const rows = await prisma.conflict.findMany({
    where: { estado: estadoFiltro },
    orderBy: [{ estado: 'asc' }, { detected_at: 'desc' }],
    include: {
      evento_google: {
        select: {
          id: true,
          titulo: true,
          fecha: true,
          hora_inicio: true,
          hora_fin: true,
          descripcion: true,
          origen: true,
        },
      },
      evento_manual: {
        select: {
          id: true,
          titulo: true,
          fecha: true,
          hora_inicio: true,
          hora_fin: true,
          descripcion: true,
          origen: true,
        },
      },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    estado: r.estado,
    nota: r.nota,
    detected_at: r.detected_at.toISOString(),
    resolved_at: r.resolved_at?.toISOString() ?? null,
    evento_google: {
      ...r.evento_google,
      fecha: r.evento_google.fecha.toISOString().slice(0, 10),
    },
    evento_manual: {
      ...r.evento_manual,
      fecha: r.evento_manual.fecha.toISOString().slice(0, 10),
    },
  }))
}

// ── resolveConflict ────────────────────────────────────────────────────────

/**
 * Marca un conflicto como "revisado" o "ignorado".
 * Solo se puede resolver un conflicto "pendiente".
 *
 * @throws Error si el conflicto no existe o ya está resuelto
 */
export async function resolveConflict(
  id: string,
  estado: 'revisado' | 'ignorado',
  nota?: string,
): Promise<ConflictoDetalle> {
  const existing = await prisma.conflict.findUnique({
    where: { id },
    select: { id: true, estado: true },
  })

  if (!existing) {
    throw Object.assign(new Error('Conflicto no encontrado'), { code: 'NOT_FOUND' })
  }
  if (existing.estado !== 'pendiente') {
    throw Object.assign(
      new Error(`El conflicto ya está en estado "${existing.estado}"`),
      { code: 'ALREADY_RESOLVED' },
    )
  }

  await prisma.conflict.update({
    where: { id },
    data: {
      estado,
      nota: nota ?? null,
      resolved_at: new Date(),
    },
  })

  const [updated] = await getConflicts(true).then((list) =>
    list.filter((c) => c.id === id),
  )
  return updated
}

// ── getPendingConflictCount ────────────────────────────────────────────────

export async function getPendingConflictCount(): Promise<number> {
  return prisma.conflict.count({ where: { estado: 'pendiente' } })
}
