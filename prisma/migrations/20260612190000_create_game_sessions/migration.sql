CREATE TABLE "game_sessions" (
    "game_id" TEXT NOT NULL,
    "join_code" VARCHAR(8) NOT NULL,
    "lobby" JSONB NOT NULL,
    "game_state" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("game_id")
);

CREATE UNIQUE INDEX "game_sessions_join_code_key" ON "game_sessions"("join_code");

CREATE INDEX "game_sessions_updated_at_idx" ON "game_sessions"("updated_at" DESC);
