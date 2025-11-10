-- Drop foreign key constraint for matchId to allow dummy data IDs
ALTER TABLE "saved_matches" DROP CONSTRAINT IF EXISTS "saved_matches_matchId_fkey";

-- Drop foreign key constraint for teamId as well (optional team support)
ALTER TABLE "saved_matches" DROP CONSTRAINT IF EXISTS "saved_matches_teamId_fkey";
