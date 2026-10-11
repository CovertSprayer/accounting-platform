import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';
import { InvoiceStatus } from '../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../domain/invoice/invoice-already-issued.error';
import { InvoiceNumberAlreadyExistsError } from '../../domain/invoice/invoice-number-already-exists.error';

// Stores snapshots rather than the caller's object, so it behaves like a database:
// changes are only persisted by save(), and two loaded copies are independent.
// That lets application tests cover the same "already issued" guard Postgres enforces.
export class InMemoryInvoiceRepository implements InvoiceRepository {
    private readonly invoices = new Map<string, Invoice>();

    async save(companyId: string, invoice: Invoice): Promise<void> {
        const key = `${companyId}:${invoice.getId()}`;
        const stored = this.invoices.get(key);

        if (!stored) {
            const duplicate = await this.findByNumber(companyId, invoice.getNumber());

            if (duplicate) {
                throw new InvoiceNumberAlreadyExistsError(companyId, invoice.getNumber());
            }

            this.invoices.set(key, this.copy(invoice));
            return;
        }

        // Drafts are not editable in this iteration: re-saving one changes nothing.
        if (invoice.getStatus() === InvoiceStatus.DRAFT) {
            return;
        }

        // Same rule as the conditional UPDATE ... WHERE status = 'DRAFT' in Postgres.
        if (stored.getStatus() !== InvoiceStatus.DRAFT) {
            throw new InvoiceAlreadyIssuedError(companyId, invoice.getId());
        }

        this.invoices.set(key, this.copy(invoice));
    }

    async findById(companyId: string, id: string): Promise<Invoice | null> {
        const stored = this.invoices.get(`${companyId}:${id}`);

        return stored ? this.copy(stored) : null;
    }

    async findAll(companyId: string): Promise<Invoice[]> {
        const prefix = `${companyId}:`;

        return Array.from(this.invoices.entries())
            .filter(([key]) => key.startsWith(prefix))
            .map(([, invoice]) => this.copy(invoice));
    }

    async findByNumber(companyId: string, number: string): Promise<Invoice | null> {
        const invoices = await this.findAll(companyId);

        return invoices.find(invoice => invoice.getNumber() === number) ?? null;
    }

    // Lines and accounts are immutable, so sharing them between copies is safe.
    private copy(invoice: Invoice): Invoice {
        return Invoice.reconstitute({
            id: invoice.getId(),
            companyId: invoice.getCompanyId(),
            customerId: invoice.getCustomerId(),
            number: invoice.getNumber(),
            issueDate: invoice.getIssueDate(),
            dueDate: invoice.getDueDate(),
            lines: [...invoice.getLines()],
            status: invoice.getStatus(),
            journalEntryId: invoice.getJournalEntryId(),
            receivableAccount: invoice.getReceivableAccount(),
        });
    }
}
