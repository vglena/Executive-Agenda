// Tipos compartidos para las respuestas de la API

export interface Task {
  id: string
  titulo: string
  descripcion: string | null
  fecha_limite: string | null  // YYYY-MM-DD
  prioridad_manual: 'P1' | 'P2' | 'P3' | 'P4'
  estado: 'pendiente' | 'completada'
  created_at: string
  completed_at: string | null
}

export interface AgendaEvent {
  id: string
  titulo: string
  fecha: string       // YYYY-MM-DD
  hora_inicio: string // HH:MM
  hora_fin: string    // HH:MM
  descripcion: string | null
  ubicacion: string | null
  estado: string
  conflicto_detectado: boolean
  created_at: string
}

export interface Reminder {
  id: string
  entidad_tipo: string   // 'tarea' | 'evento'
  task_id: string | null
  event_id: string | null
  antelacion_tipo: string
  fecha_hora_disparo: string  // ISO
  mensaje: string | null
  origen: string
  estado: string  // 'activo' | 'disparado' | 'cancelado'
}

export interface PriorityTask {
  posicion: number
  id: string
  titulo: string
  prioridad_manual: 'P1' | 'P2' | 'P3' | 'P4'
  fecha_limite: string | null  // YYYY-MM-DD
  score: number
  justificacion: string
}

export interface DailySummary {
  fecha: string
  contenido_completo: string
  sugerencia_del_dia: string
  eventos_del_dia: string[]
  tareas_vencidas: string[]
  tareas_prioritarias: string[]
  estado: string
  generated_at: string
}
