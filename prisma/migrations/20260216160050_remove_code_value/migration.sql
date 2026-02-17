/*
  Warnings:

  - The primary key for the `Code` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `codeValue` on the `Code` table. All the data in the column will be lost.
  - Changed the type of `code` on the `Code` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Code" DROP CONSTRAINT "Code_masterCode_fkey";

-- AlterTable
ALTER TABLE "Code" DROP CONSTRAINT "Code_pkey",
DROP COLUMN "codeValue",
DROP COLUMN "code",
ADD COLUMN     "code" UUID NOT NULL,
ALTER COLUMN "masterCode" SET DATA TYPE TEXT,
ALTER COLUMN "codeName" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ADD CONSTRAINT "Code_pkey" PRIMARY KEY ("code");

-- CreateIndex
CREATE INDEX "Code_sortOrder_idx" ON "Code"("sortOrder");

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_masterCode_fkey" FOREIGN KEY ("masterCode") REFERENCES "MasterCode"("code") ON DELETE CASCADE ON UPDATE CASCADE;
