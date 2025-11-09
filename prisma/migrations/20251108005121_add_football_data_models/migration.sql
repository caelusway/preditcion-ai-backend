-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiId" TEXT,
    "logoUrl" TEXT,
    "country" TEXT,
    "league" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "apiId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "kickoffTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "venue" TEXT,
    "referee" TEXT,
    "league" TEXT,
    "season" TEXT,
    "round" TEXT,
    "externalData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT,
    "homeWinProbability" DOUBLE PRECISION NOT NULL,
    "drawProbability" DOUBLE PRECISION NOT NULL,
    "awayWinProbability" DOUBLE PRECISION NOT NULL,
    "predictedHomeScore" DOUBLE PRECISION,
    "predictedAwayScore" DOUBLE PRECISION,
    "confidence" TEXT NOT NULL,
    "aiModel" TEXT,
    "reasoning" TEXT NOT NULL,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_statistics" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeFormW" INTEGER NOT NULL DEFAULT 0,
    "homeFormD" INTEGER NOT NULL DEFAULT 0,
    "homeFormL" INTEGER NOT NULL DEFAULT 0,
    "awayFormW" INTEGER NOT NULL DEFAULT 0,
    "awayFormD" INTEGER NOT NULL DEFAULT 0,
    "awayFormL" INTEGER NOT NULL DEFAULT 0,
    "homeFormString" TEXT,
    "awayFormString" TEXT,
    "homeGoalsScored" INTEGER NOT NULL DEFAULT 0,
    "homeGoalsConceded" INTEGER NOT NULL DEFAULT 0,
    "awayGoalsScored" INTEGER NOT NULL DEFAULT 0,
    "awayGoalsConceded" INTEGER NOT NULL DEFAULT 0,
    "homeExpectedGoals" DOUBLE PRECISION,
    "awayExpectedGoals" DOUBLE PRECISION,
    "h2hHomeWins" INTEGER NOT NULL DEFAULT 0,
    "h2hDraws" INTEGER NOT NULL DEFAULT 0,
    "h2hAwayWins" INTEGER NOT NULL DEFAULT 0,
    "h2hTotalMatches" INTEGER NOT NULL DEFAULT 0,
    "homeInjuries" INTEGER NOT NULL DEFAULT 0,
    "awayInjuries" INTEGER NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_apiId_key" ON "teams"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_apiId_key" ON "matches"("apiId");

-- CreateIndex
CREATE INDEX "matches_homeTeamId_idx" ON "matches"("homeTeamId");

-- CreateIndex
CREATE INDEX "matches_awayTeamId_idx" ON "matches"("awayTeamId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_kickoffTime_idx" ON "matches"("kickoffTime");

-- CreateIndex
CREATE INDEX "predictions_matchId_idx" ON "predictions"("matchId");

-- CreateIndex
CREATE INDEX "predictions_userId_idx" ON "predictions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "match_statistics_matchId_key" ON "match_statistics"("matchId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_statistics" ADD CONSTRAINT "match_statistics_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
