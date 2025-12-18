-- AlterTable
ALTER TABLE "coupon_selections" ADD COLUMN     "awayTeamLogoUrl" TEXT,
ADD COLUMN     "homeTeamLogoUrl" TEXT;

-- AddForeignKey
ALTER TABLE "saved_matches" ADD CONSTRAINT "saved_matches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_matches" ADD CONSTRAINT "saved_matches_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
