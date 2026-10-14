import { Account } from '../../domain/account/account';
import { AccountRepository } from '../../domain/account/account-repository';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { Money } from '../../domain/shared/money';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';
import { NotFoundError } from '../shared/not-found.error';
import { UnitOfWork } from '../shared/unit-of-work';

export interface IssueInvoiceInput {
    invoiceId: string;
    // The caller chooses the receivable account. The domain only checks that it
    // is an ASSET of the same company; it cannot prove it is Accounts Receivable.
    receivableAccountId: string;
    journalEntryId: string;
}

// Issuing posts the invoice to the ledger:
//   Dr Accounts Receivable   invoice total
//      Cr Revenue            line amounts, grouped by revenue account
export class IssueInvoice {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
        private readonly accountRepository: AccountRepository,
        private readonly unitOfWork: UnitOfWork,
    ) { }

    // Everything runs in one unit of work: if saving the invoice fails (for example
    // because a concurrent request issued it first), the journal entry is rolled back too.
    async execute(companyId: string, input: IssueInvoiceInput): Promise<Invoice> {
        return this.unitOfWork.run(async () => {
            const invoice = await this.invoiceRepository.findById(companyId, input.invoiceId);

            if (!invoice) {
                throw new NotFoundError(`Invoice not found: ${input.invoiceId}`);
            }

            const receivableAccount = await this.accountRepository.findById(
                companyId,
                input.receivableAccountId,
            );

            if (!receivableAccount) {
                throw new DomainValidationError(
                    `Account not found: ${input.receivableAccountId}`,
                );
            }

            // The journal entry repository updates an existing entry with the same id,
            // so an id that is already taken must be rejected here.
            const existingEntry = await this.journalEntryRepository.findById(
                companyId,
                input.journalEntryId,
            );

            if (existingEntry) {
                throw new DomainValidationError(
                    `Journal entry already exists: ${input.journalEntryId}`,
                );
            }

            // Checks DRAFT status and the receivable account before anything is written.
            invoice.issue(input.journalEntryId, receivableAccount);

            const entry = JournalEntry.create(
                input.journalEntryId,
                companyId,
                invoice.getIssueDate(),
                [
                    JournalEntryLine.debit(receivableAccount, invoice.getTotal()),
                    ...this.revenueCredits(invoice),
                ],
            );
            entry.post();

            await this.journalEntryRepository.save(companyId, entry);
            await this.invoiceRepository.save(companyId, invoice);

            return invoice;
        });
    }

    // One credit per revenue account, in the order the accounts first appear.
    private revenueCredits(invoice: Invoice): JournalEntryLine[] {
        const totals = new Map<string, { account: Account; amount: Money }>();

        for (const line of invoice.getLines()) {
            const account = line.getRevenueAccount();
            const current = totals.get(account.getId());

            totals.set(account.getId(), {
                account,
                amount: current
                    ? current.amount.add(line.getAmount())
                    : line.getAmount(),
            });
        }

        return Array.from(totals.values()).map(({ account, amount }) =>
            JournalEntryLine.credit(account, amount),
        );
    }
}
