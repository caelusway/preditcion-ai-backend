-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "currency" TEXT DEFAULT 'TRY',
ADD COLUMN     "potentialWin" DOUBLE PRECISION,
ADD COLUMN     "result" TEXT,
ADD COLUMN     "stake" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "coupons_result_idx" ON "coupons"("result");
