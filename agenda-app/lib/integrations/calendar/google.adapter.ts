import { google } from 'googleapis'
import { prisma } from '@/lib/db'
import { createOAuth2Client } from './google-oauth'
import { decryptTokens, encryptTokens, type GoogleTokenData } from './token-crypto'
import type { CalendarEvent, CalendarProvider } from './types'

/**
 * GoogleCalendarAdapter — implementación de CalendarProvider para Google Calendar API v3.
 * Solo se activa si el ejecutivo conecta su cuenta via OAuth.
 * El sistema funciona sin esta clase (usa NullCalendarAdapter por defecto).
 */
export class GoogleCalendarAdapter implements CalendarProvider {
  async isConnected(): Promise<boolean> {
    const tokens = await this.loadTokens()
    return tokens !== null
  }

  async getEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
    const tokens = await this.loadTokens()
    if (!tokens) return []

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    })

    // Escuchar refresh automático y persistir el nuevo access_token
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        const updated: GoogleTokenData = {
          ...tokens,
          access_token: newTokens.access_token,
          expiry_date: newTokens.expiry_date ?? Date.now() + 3600 * 1000,
        }
        await this.saveTokens(updated)
      }
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })

    const items = response.data.items ?? []
    return items
      .filter((e) => e.id && e.summary && e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        externalId: e.id!,
        titulo: e.summary!,
        fecha: e.start!.dateTime!.substring(0, 10),
        horaInicio: e.start!.dateTime!.substring(11, 16),
        horaFin: e.end!.dateTime!.substring(11, 16),
        descripcion: e.description ?? undefined,
      }))
  }

  async disconnect(): Promise<void> {
    const tokens = await this.loadTokens()
    if (tokens) {
      // Revocar en Google (best-effort — no bloquea si falla)
      try {
        const oauth2Client = createOAuth2Client()
        await oauth2Client.revokeToken(tokens.access_token)
      } catch {
        // ignorado — el borrado local siempre ocurre
      }
    }
    // Limpiar tokens en DB
    const executive = await prisma.executive.findFirst()
    if (executive) {
      await prisma.executive.update({
        where: { id: executive.id },
        data: { google_calendar_token: { set: null } },
      })
    }
  }

  /** Carga y desencripta los tokens desde la DB. Devuelve null si no hay tokens. */
  async loadTokens(): Promise<GoogleTokenData | null> {
    const executive = await prisma.executive.findFirst({
      select: { google_calendar_token: true },
    })
    if (!executive?.google_calendar_token) return null

    try {
      const raw = executive.google_calendar_token as string
      return decryptTokens(raw)
    } catch (err) {
      console.error('[GoogleCalendarAdapter] Error al desencriptar tokens:', err)
      return null
    }
  }

  /** Encripta y guarda los tokens en la DB. */
  async saveTokens(tokens: GoogleTokenData): Promise<void> {
    const executive = await prisma.executive.findFirst()
    if (!executive) throw new Error('No se encontró el ejecutivo en la DB.')

    const encrypted = encryptTokens(tokens)
    await prisma.executive.update({
      where: { id: executive.id },
      data: { google_calendar_token: encrypted },
    })
  }
}
