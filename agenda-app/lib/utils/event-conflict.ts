import { prisma } from '@/lib/db'

/**
 * detectConflict — comprueba si un evento nuevo/actualizado se solapa con otro activo
 * en el mismo día.
 *
 * Lógica de solapamiento: dos franjas [A_ini, A_fin) y [B_ini, B_fin) se solapan cuando
 *   A_ini < B_fin  &&  A_fin > B_ini
 * Las horas son strings "HH:MM" — la comparación lexicográfica es equivalente a la numérica
 * en formato de 24h con cero a la izquierda.
 *
 * @param fecha     - fecha del evento (Date en UTC medianoche)
 * @param horaInicio - "HH:MM"
 * @param horaFin   - "HH:MM"
 * @param excludeId - ID del evento a excluir en actualizaciones
 * @returns true si hay al menos un evento activo solapado
 */
export async function detectConflict(
  fecha: Date,
  horaInicio: string,
  horaFin: string,
  excludeId?: string,
): Promise<boolean> {
  const candidatos = await prisma.event.findMany({
    where: {
      fecha,
      estado: 'activo',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { hora_inicio: true, hora_fin: true },
  })

  return candidatos.some(
    (c) => horaInicio < c.hora_fin && horaFin > c.hora_inicio,
  )
}
