-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "leagueId" INTEGER;

-- CreateTable
CREATE TABLE "match_odds" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchApiId" TEXT NOT NULL,
    "homeWinOdds" DOUBLE PRECISION,
    "drawOdds" DOUBLE PRECISION,
    "awayWinOdds" DOUBLE PRECISION,
    "homeOrDrawOdds" DOUBLE PRECISION,
    "awayOrDrawOdds" DOUBLE PRECISION,
    "homeOrAwayOdds" DOUBLE PRECISION,
    "over25Odds" DOUBLE PRECISION,
    "under25Odds" DOUBLE PRECISION,
    "over15Odds" DOUBLE PRECISION,
    "under15Odds" DOUBLE PRECISION,
    "over35Odds" DOUBLE PRECISION,
    "under35Odds" DOUBLE PRECISION,
    "bttsYesOdds" DOUBLE PRECISION,
    "bttsNoOdds" DOUBLE PRECISION,
    "bookmaker" TEXT,
    "bookmakerId" INTEGER,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_odds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "leagueIds" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_odds_matchId_key" ON "match_odds"("matchId");

-- CreateIndex
CREATE INDEX "match_odds_matchApiId_idx" ON "match_odds"("matchApiId");

-- CreateIndex
CREATE INDEX "sync_logs_syncType_idx" ON "sync_logs"("syncType");

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");

-- CreateIndex
CREATE INDEX "sync_logs_startedAt_idx" ON "sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "matches_leagueId_idx" ON "matches"("leagueId");

-- AddForeignKey
ALTER TABLE "match_odds" ADD CONSTRAINT "match_odds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
