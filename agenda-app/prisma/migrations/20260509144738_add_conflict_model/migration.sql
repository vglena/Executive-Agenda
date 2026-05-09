-- CreateTable
CREATE TABLE "Conflict" (
    "id" TEXT NOT NULL,
    "evento_google_id" TEXT NOT NULL,
    "evento_manual_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "nota" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conflict_evento_google_id_evento_manual_id_key" ON "Conflict"("evento_google_id", "evento_manual_id");

-- AddForeignKey
ALTER TABLE "Conflict" ADD CONSTRAINT "Conflict_evento_google_id_fkey" FOREIGN KEY ("evento_google_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conflict" ADD CONSTRAINT "Conflict_evento_manual_id_fkey" FOREIGN KEY ("evento_manual_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
