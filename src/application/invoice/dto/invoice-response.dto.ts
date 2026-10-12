import { Invoice } from '../../../domain/invoice/invoice';

// All decimal values are strings, so clients never receive a rounded JS number.
export class InvoiceLineResponseDto {
    description: string;
    quantity: string;
    unitPrice: string;
    revenueAccountId: string;
    revenueAccountName: string;
    amount: string;
}

export class InvoiceResponseDto {
    id: string;
    companyId: string;
    customerId: string;
    number: string;
    issueDate: string;
    dueDate: string;
    status: string;
    total: string;
    journalEntryId: string | null;
    receivableAccountId: string | null;
    lines: InvoiceLineResponseDto[];

    static fromDomain(
        invoice: Invoice,
    ): InvoiceResponseDto {
        return {
            id: invoice.getId(),
            companyId: invoice.getCompanyId(),
            customerId: invoice.getCustomerId(),
            number: invoice.getNumber(),
            // Stored as DATE, so return the calendar date only.
            issueDate: invoice.getIssueDate().toISOString().slice(0, 10),
            dueDate: invoice.getDueDate().toISOString().slice(0, 10),
            status: invoice.getStatus(),
            total: invoice.getTotal().toString(),
            journalEntryId: invoice.getJournalEntryId(),
            receivableAccountId: invoice.getReceivableAccount()?.getId() ?? null,
            lines: invoice.getLines().map((line) => ({
                description: line.getDescription(),
                quantity: line.getQuantity().toFixed(4),
                unitPrice: line.getUnitPrice().toDecimal().toFixed(4),
                revenueAccountId: line.getRevenueAccount().getId(),
                revenueAccountName: line.getRevenueAccount().getName(),
                amount: line.getAmount().toString(),
            })),
        };
    }
}
