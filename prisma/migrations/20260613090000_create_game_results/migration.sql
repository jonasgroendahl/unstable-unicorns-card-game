CREATE TABLE "game_results" (
    "game_id" TEXT NOT NULL,
    "winner_name" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "turn_count" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("game_id")
);

CREATE INDEX "game_results_finished_at_idx" ON "game_results"("finished_at" DESC);
