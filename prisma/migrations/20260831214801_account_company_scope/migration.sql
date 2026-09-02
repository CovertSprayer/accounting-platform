/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `companyId` to the `JournalEntryLine` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JournalEntryLine" DROP CONSTRAINT "JournalEntryLine_accountId_fkey";

-- DropIndex
DROP INDEX "JournalEntryLine_accountId_idx";

-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("companyId", "id");

-- AlterTable
ALTER TABLE "JournalEntryLine" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "JournalEntryLine_companyId_accountId_idx" ON "JournalEntryLine"("companyId", "accountId");

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_companyId_accountId_fkey" FOREIGN KEY ("companyId", "accountId") REFERENCES "Account"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
