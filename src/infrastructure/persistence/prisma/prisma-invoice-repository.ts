import { Injectable } from '@nestjs/common';
import { Prisma, InvoiceStatus as PrismaInvoiceStatus } from '@prisma/client';

import { Invoice } from '../../../domain/invoice/invoice';
import { InvoiceRepository } from '../../../domain/invoice/invoice-repository';
import { InvoiceStatus } from '../../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../../domain/invoice/invoice-already-issued.error';
import { InvoiceNumberAlreadyExistsError } from '../../../domain/invoice/invoice-number-already-exists.error';

import { PrismaService } from '../../database/prisma.service';
import { PrismaTransactionContext } from '../../database/prisma-transaction-context';
import { InvoiceMapper, invoiceInclude } from './invoice.mapper';

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly txContext: PrismaTransactionContext,
    ) { }

    // Inside a unit of work this joins its transaction, so a failure here also
    // rolls back the journal entry written earlier in the same unit of work.
    async save(companyId: string, invoice: Invoice): Promise<void> {
        try {
            await this.txContext.transaction(this.prisma, (tx) =>
                this.write(tx, companyId, invoice),
            );
        } catch (error) {
            if (this.isDuplicateNumberError(error)) {
                throw new InvoiceNumberAlreadyExistsError(companyId, invoice.getNumber());
            }

            throw error;
        }
    }

    private async write(
        tx: Prisma.TransactionClient,
        companyId: string,
        invoice: Invoice,
    ): Promise<void> {
        const existing = await tx.invoice.findUnique({
            where: {
                companyId_id: { companyId, id: invoice.getId() },
            },
            select: { status: true },
        });

        if (!existing) {
            await this.create(tx, companyId, invoice);
            return;
        }

        // Drafts are not editable in this iteration: re-saving one changes nothing.
        if (invoice.getStatus() === InvoiceStatus.DRAFT) {
            return;
        }

        await this.markIssued(tx, companyId, invoice);
    }

    async findById(companyId: string, id: string): Promise<Invoice | null> {
        const data = await this.txContext.client(this.prisma).invoice.findUnique({
            where: {
                companyId_id: { companyId, id },
            },
            include: invoiceInclude,
        });

        return data ? InvoiceMapper.toDomain(data) : null;
    }

    async findAll(companyId: string): Promise<Invoice[]> {
        const data = await this.txContext.client(this.prisma).invoice.findMany({
            where: { companyId },
            include: invoiceInclude,
            orderBy: { createdAt: 'asc' },
        });

        return data.map((invoice) => InvoiceMapper.toDomain(invoice));
    }

    async findByNumber(companyId: string, number: string): Promise<Invoice | null> {
        const data = await this.txContext.client(this.prisma).invoice.findUnique({
            where: {
                companyId_number: { companyId, number },
            },
            include: invoiceInclude,
        });

        return data ? InvoiceMapper.toDomain(data) : null;
    }

    private async create(
        tx: Prisma.TransactionClient,
        companyId: string,
        invoice: Invoice,
    ): Promise<void> {
        await tx.invoice.create({
            data: {
                id: invoice.getId(),
                companyId,
                customerId: invoice.getCustomerId(),
                number: invoice.getNumber(),
                issueDate: invoice.getIssueDate(),
                dueDate: invoice.getDueDate(),
                status: InvoiceMapper.toPrismaStatus(invoice.getStatus()),
                journalEntryId: invoice.getJournalEntryId(),
                receivableAccountId: invoice.getReceivableAccount()?.getId() ?? null,
            },
        });

        // toFixed(4), not Money.toString(), which would round to 2 dp.
        await tx.invoiceLine.createMany({
            data: invoice.getLines().map((line, position) => ({
                id: crypto.randomUUID(),
                companyId,
                invoiceId: invoice.getId(),
                accountId: line.getRevenueAccount().getId(),
                position,
                description: line.getDescription(),
                quantity: line.getQuantity().toFixed(4),
                unitPrice: line.getUnitPrice().toDecimal().toFixed(4),
            })),
        });
    }

    // Conditional update: only succeeds while the stored row is still DRAFT.
    // A concurrent request that already issued the invoice holds the row lock;
    // once it commits, this UPDATE matches 0 rows and we report the conflict.
    private async markIssued(
        tx: Prisma.TransactionClient,
        companyId: string,
        invoice: Invoice,
    ): Promise<void> {
        const { count } = await tx.invoice.updateMany({
            where: {
                companyId,
                id: invoice.getId(),
                status: PrismaInvoiceStatus.DRAFT,
            },
            data: {
                status: InvoiceMapper.toPrismaStatus(invoice.getStatus()),
                journalEntryId: invoice.getJournalEntryId(),
                receivableAccountId: invoice.getReceivableAccount()?.getId() ?? null,
            },
        });

        if (count === 0) {
            throw new InvoiceAlreadyIssuedError(companyId, invoice.getId());
        }
    }

    // Only the (companyId, number) unique constraint counts as a duplicate number.
    // Other unique violations (e.g. duplicate primary key) are rethrown as-is.
    private isDuplicateNumberError(error: unknown): boolean {
        if (
            !(error instanceof Prisma.PrismaClientKnownRequestError) ||
            error.code !== 'P2002'
        ) {
            return false;
        }

        const target = error.meta?.target;

        if (Array.isArray(target)) {
            return target.includes('number');
        }

        return typeof target === 'string' && target.includes('number');
    }
}
