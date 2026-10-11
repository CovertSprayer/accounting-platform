-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "journalEntryId" TEXT,
    "receivableAccountId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("companyId","id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_companyId_customerId_idx" ON "Invoice"("companyId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_number_key" ON "Invoice"("companyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_journalEntryId_key" ON "Invoice"("companyId", "journalEntryId");

-- CreateIndex
CREATE INDEX "InvoiceLine_companyId_accountId_idx" ON "InvoiceLine"("companyId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLine_companyId_invoiceId_position_key" ON "InvoiceLine"("companyId", "invoiceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_companyId_id_key" ON "JournalEntry"("companyId", "id");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_customerId_fkey" FOREIGN KEY ("companyId", "customerId") REFERENCES "Customer"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_receivableAccountId_fkey" FOREIGN KEY ("companyId", "receivableAccountId") REFERENCES "Account"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_journalEntryId_fkey" FOREIGN KEY ("companyId", "journalEntryId") REFERENCES "JournalEntry"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_companyId_invoiceId_fkey" FOREIGN KEY ("companyId", "invoiceId") REFERENCES "Invoice"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_companyId_accountId_fkey" FOREIGN KEY ("companyId", "accountId") REFERENCES "Account"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddCheckConstraint (hand-written: Prisma cannot express CHECK constraints)
-- An invoice is ISSUED exactly when it has both a journal entry and a receivable account.
-- Update this constraint when new statuses (PAID, VOID, ...) are added.
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issued_consistency_check" CHECK (
    ("status" = 'DRAFT'  AND "journalEntryId" IS NULL     AND "receivableAccountId" IS NULL) OR
    ("status" = 'ISSUED' AND "journalEntryId" IS NOT NULL AND "receivableAccountId" IS NOT NULL)
);
