-- CreateTable
CREATE TABLE "standings" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "league" TEXT NOT NULL DEFAULT 'Premier League',
    "rank" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "goalsDiff" INTEGER NOT NULL,
    "played" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "draws" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "goalsFor" INTEGER NOT NULL,
    "goalsAgainst" INTEGER NOT NULL,
    "homePlayed" INTEGER NOT NULL,
    "homeWins" INTEGER NOT NULL,
    "homeDraws" INTEGER NOT NULL,
    "homeLosses" INTEGER NOT NULL,
    "homeGoalsFor" INTEGER NOT NULL,
    "homeGoalsAgainst" INTEGER NOT NULL,
    "awayPlayed" INTEGER NOT NULL,
    "awayWins" INTEGER NOT NULL,
    "awayDraws" INTEGER NOT NULL,
    "awayLosses" INTEGER NOT NULL,
    "awayGoalsFor" INTEGER NOT NULL,
    "awayGoalsAgainst" INTEGER NOT NULL,
    "form" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_stats" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "league" TEXT NOT NULL DEFAULT 'Premier League',
    "name" TEXT NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "age" INTEGER,
    "nationality" TEXT,
    "photo" TEXT,
    "position" TEXT,
    "appearences" INTEGER NOT NULL DEFAULT 0,
    "lineups" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "shotsOn" INTEGER NOT NULL DEFAULT 0,
    "penaltyScored" INTEGER NOT NULL DEFAULT 0,
    "penaltyMissed" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "keyPasses" INTEGER NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "duelsWon" INTEGER NOT NULL DEFAULT 0,
    "dribblesSuccess" INTEGER NOT NULL DEFAULT 0,
    "foulsDrawn" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standings_season_idx" ON "standings"("season");

-- CreateIndex
CREATE INDEX "standings_rank_idx" ON "standings"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "standings_teamId_season_key" ON "standings"("teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_apiId_key" ON "player_stats"("apiId");

-- CreateIndex
CREATE INDEX "player_stats_teamId_idx" ON "player_stats"("teamId");

-- CreateIndex
CREATE INDEX "player_stats_season_idx" ON "player_stats"("season");

-- CreateIndex
CREATE INDEX "player_stats_goals_idx" ON "player_stats"("goals");

-- CreateIndex
CREATE INDEX "player_stats_assists_idx" ON "player_stats"("assists");

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_apiId_season_key" ON "player_stats"("apiId", "season");

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
