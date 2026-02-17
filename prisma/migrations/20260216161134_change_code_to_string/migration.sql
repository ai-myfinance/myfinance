-- DropForeignKey
ALTER TABLE "Code" DROP CONSTRAINT "Code_masterCode_fkey";

-- DropIndex
DROP INDEX "Code_masterCode_idx";

-- AlterTable
ALTER TABLE "Code" ALTER COLUMN "code" DROP DEFAULT,
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "masterCode" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "MasterCode" ALTER COLUMN "code" DROP DEFAULT,
ALTER COLUMN "code" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "Code_masterCode_idx" ON "Code"("masterCode");

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_masterCode_fkey" FOREIGN KEY ("masterCode") REFERENCES "MasterCode"("code") ON DELETE CASCADE ON UPDATE CASCADE;