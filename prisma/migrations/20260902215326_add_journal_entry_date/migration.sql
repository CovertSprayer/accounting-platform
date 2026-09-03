-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "date" DATE;

-- Backfill existing rows with their createdAt as a reasonable default
UPDATE "JournalEntry" SET "date" = "createdAt"::DATE WHERE "date" IS NULL;

-- AlterTable
ALTER TABLE "JournalEntry" ALTER COLUMN "date" SET NOT NULL;
