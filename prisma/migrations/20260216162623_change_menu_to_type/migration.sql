/*
  Warnings:

  - You are about to drop the column `filePath` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `isSystemAdmin` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `menuName` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `urlPath` on the `Menu` table. All the data in the column will be lost.
  - Added the required column `name` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Menu` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_parentId_fkey";

-- AlterTable
ALTER TABLE "MasterCode" ALTER COLUMN "codeName" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "filePath",
DROP COLUMN "isAdmin",
DROP COLUMN "isSystemAdmin",
DROP COLUMN "menuName",
DROP COLUMN "urlPath",
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Menu_type_idx" ON "Menu"("type");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
