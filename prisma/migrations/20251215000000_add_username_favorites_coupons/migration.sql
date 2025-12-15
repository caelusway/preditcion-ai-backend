-- Add username column (nullable first)
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Set username from email (part before @) with random suffix to ensure uniqueness
UPDATE "users" SET "username" = CONCAT(SPLIT_PART(email, '@', 1), '_', SUBSTRING(MD5(RANDOM()::text), 1, 6));

-- Make username required and unique
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");

-- Add selectedTeamId column
ALTER TABLE "users" ADD COLUMN "selectedTeamId" TEXT;

-- Add foreign key constraint for selectedTeamId
ALTER TABLE "users" ADD CONSTRAINT "users_selectedTeamId_fkey" FOREIGN KEY ("selectedTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable for FavoriteLeague
CREATE TABLE "favorite_leagues" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "leagueName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Coupon
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalOdds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable for CouponSelection
CREATE TABLE "coupon_selections" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "matchId" TEXT,
    "matchApiId" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "kickoffTime" TIMESTAMP(3) NOT NULL,
    "league" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_leagues_userId_idx" ON "favorite_leagues"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_leagues_userId_leagueId_key" ON "favorite_leagues"("userId", "leagueId");

-- CreateIndex
CREATE INDEX "coupons_userId_idx" ON "coupons"("userId");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "coupon_selections_couponId_idx" ON "coupon_selections"("couponId");

-- CreateIndex
CREATE INDEX "coupon_selections_matchId_idx" ON "coupon_selections"("matchId");

-- AddForeignKey
ALTER TABLE "favorite_leagues" ADD CONSTRAINT "favorite_leagues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_selections" ADD CONSTRAINT "coupon_selections_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_selections" ADD CONSTRAINT "coupon_selections_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
