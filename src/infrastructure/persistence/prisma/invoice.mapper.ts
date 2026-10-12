import Decimal from 'decimal.js';
import { Prisma, InvoiceStatus as PrismaInvoiceStatus } from '@prisma/client';
import { Invoice } from '../../../domain/invoice/invoice';
import { InvoiceLine } from '../../../domain/invoice/invoice-line';
import { InvoiceStatus } from '../../../domain/invoice/invoice-status';
import { Money } from '../../../domain/shared/money';
import { AccountMapper } from './account.mapper';

// Everything needed to rebuild the aggregate in a single query.
export const invoiceInclude = {
    lines: {
        include: { account: true },
        orderBy: { position: 'asc' },
    },
    receivableAccount: true,
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
    include: typeof invoiceInclude;
}>;

export class InvoiceMapper {
    // Decimals are read via toString(), never Number(), to keep every digit.
    // Invoice.reconstitute re-runs domain validation, including the check that
    // every account belongs to the invoice's company.
    static toDomain(data: InvoiceWithRelations): Invoice {
        const lines = data.lines.map((line) =>
            InvoiceLine.create(
                line.description,
                new Decimal(line.quantity.toString()),
                Money.create(line.unitPrice.toString()),
                AccountMapper.toDomain(line.account),
            ),
        );

        return Invoice.reconstitute({
            id: data.id,
            companyId: data.companyId,
            customerId: data.customerId,
            number: data.number,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            lines,
            status: this.toDomainStatus(data.status),
            journalEntryId: data.journalEntryId,
            receivableAccount: data.receivableAccount
                ? AccountMapper.toDomain(data.receivableAccount)
                : null,
        });
    }

    static toPrismaStatus(status: InvoiceStatus): PrismaInvoiceStatus {
        switch (status) {
            case InvoiceStatus.DRAFT:
                return PrismaInvoiceStatus.DRAFT;

            case InvoiceStatus.ISSUED:
                return PrismaInvoiceStatus.ISSUED;
        }
    }

    private static toDomainStatus(status: PrismaInvoiceStatus): InvoiceStatus {
        switch (status) {
            case PrismaInvoiceStatus.DRAFT:
                return InvoiceStatus.DRAFT;

            case PrismaInvoiceStatus.ISSUED:
                return InvoiceStatus.ISSUED;
        }
    }
}
