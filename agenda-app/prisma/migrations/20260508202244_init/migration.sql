-- CreateTable
CREATE TABLE "Executive" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zona_horaria" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "horario_laboral_inicio" TEXT NOT NULL DEFAULT '08:00',
    "horario_laboral_fin" TEXT NOT NULL DEFAULT '19:00',
    "dias_laborables" TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::TEXT[],
    "hora_resumen_diario" TEXT NOT NULL DEFAULT '07:30',
    "google_calendar_token" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Executive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "descripcion" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "id_externo" TEXT,
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "conflicto_detectado" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_limite" DATE,
    "prioridad_manual" TEXT NOT NULL DEFAULT 'P3',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "entidad_tipo" TEXT NOT NULL,
    "task_id" TEXT,
    "event_id" TEXT,
    "antelacion_tipo" TEXT NOT NULL,
    "fecha_hora_disparo" TIMESTAMP(3) NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'usuario',
    "estado" TEXT NOT NULL DEFAULT 'activo',

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPriority" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tareas_rankeadas" TEXT[],
    "scores" JSONB NOT NULL,
    "justificaciones" JSONB NOT NULL,
    "tareas_rechazadas_hoy" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'vigente',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recalculated_at" TIMESTAMP(3),

    CONSTRAINT "DailyPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "contenido_completo" TEXT NOT NULL,
    "eventos_del_dia" TEXT[],
    "tareas_vencidas" TEXT[],
    "tareas_prioritarias" TEXT[],
    "sugerencia_del_dia" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'generado',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_id_externo_key" ON "Event"("id_externo");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_task_id_key" ON "Reminder"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPriority_fecha_key" ON "DailyPriority"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_fecha_key" ON "DailySummary"("fecha");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
