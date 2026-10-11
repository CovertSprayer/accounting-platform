import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { Money } from '../shared/money';
import { DomainValidationError } from '../shared/domain-validation.error';
import { InvoiceLine } from './invoice-line';
import { InvoiceStatus } from './invoice-status';
import { InvoiceAlreadyIssuedError } from './invoice-already-issued.error';
import { MAX_MONEY_AMOUNT } from './invoice-limits';

// Named fields instead of positional arguments: issueDate and dueDate are both
// Dates, so swapping them positionally would compile without complaint.
export interface CreateInvoiceProps {
    id: string;
    companyId: string;
    customerId: string;
    number: string;
    issueDate: Date;
    dueDate: Date;
    lines: InvoiceLine[];
}

export interface ReconstituteInvoiceProps extends CreateInvoiceProps {
    status: InvoiceStatus;
    journalEntryId: string | null;
    receivableAccount: Account | null;
}

export class Invoice {
    private readonly id: string;
    private readonly companyId: string;
    private readonly customerId: string;
    private readonly number: string;
    private readonly issueDate: Date;
    private readonly dueDate: Date;
    private readonly lines: InvoiceLine[];
    private readonly total: Money;

    private status: InvoiceStatus;
    private journalEntryId: string | null;
    private receivableAccount: Account | null;

    private constructor(props: ReconstituteInvoiceProps) {
        this.id = props.id;
        this.companyId = props.companyId;
        this.customerId = props.customerId;
        this.number = props.number.trim();
        this.issueDate = props.issueDate;
        this.dueDate = props.dueDate;
        // Copy so the caller's array cannot change the aggregate afterwards.
        this.lines = [...props.lines];
        this.total = this.lines.reduce(
            (total, line) => total.add(line.getAmount()),
            Money.zero(),
        );
        this.status = props.status;
        this.journalEntryId = props.journalEntryId;
        this.receivableAccount = props.receivableAccount;

        this.validate();
    }

    static create(props: CreateInvoiceProps): Invoice {
        return new Invoice({
            ...props,
            status: InvoiceStatus.DRAFT,
            journalEntryId: null,
            receivableAccount: null,
        });
    }

    // Runs the same validation as create(), so corrupted persisted data fails loudly.
    static reconstitute(props: ReconstituteInvoiceProps): Invoice {
        return new Invoice(props);
    }

    private validate(): void {
        if (!this.companyId.trim()) {
            throw new DomainValidationError('Invoice companyId is required');
        }
        if (!this.customerId.trim()) {
            throw new DomainValidationError('Invoice customerId is required');
        }
        if (!this.number) {
            throw new DomainValidationError('Invoice number cannot be empty');
        }
        if (Number.isNaN(this.issueDate.getTime()) || Number.isNaN(this.dueDate.getTime())) {
            throw new DomainValidationError('Invoice dates must be valid');
        }
        if (this.dueDate < this.issueDate) {
            throw new DomainValidationError('Invoice due date cannot be before the issue date');
        }
        if (this.lines.length < 1) {
            throw new DomainValidationError('Invoice must contain at least one line');
        }

        for (const line of this.lines) {
            if (line.getRevenueAccount().getCompanyId() !== this.companyId) {
                throw new DomainValidationError(
                    'Invoice line account must belong to the same company',
                );
            }
        }

        // The total becomes the receivable debit, the largest journal entry amount.
        if (this.total.toDecimal().greaterThan(MAX_MONEY_AMOUNT)) {
            throw new DomainValidationError('Invoice total exceeds the supported maximum');
        }

        this.validateIssuedState();
    }

    // ISSUED exactly when both the journal entry and receivable account are set.
    private validateIssuedState(): void {
        if (this.status === InvoiceStatus.DRAFT) {
            if (this.journalEntryId !== null || this.receivableAccount !== null) {
                throw new DomainValidationError(
                    'Draft invoice cannot have a journal entry or receivable account',
                );
            }
            return;
        }

        if (!this.journalEntryId?.trim() || this.receivableAccount === null) {
            throw new DomainValidationError(
                'Issued invoice must have a journal entry and receivable account',
            );
        }

        this.validateReceivableAccount(this.receivableAccount);
    }

    // Limitation: ASSET does not prove the account is Accounts Receivable.
    // The caller chooses the account; a dedicated AR setting comes with the AR feature.
    private validateReceivableAccount(account: Account): void {
        if (account.getType() !== AccountType.ASSET) {
            throw new DomainValidationError(
                'Invoice receivable account must be an asset account',
            );
        }
        if (account.getCompanyId() !== this.companyId) {
            throw new DomainValidationError(
                'Invoice receivable account must belong to the same company',
            );
        }
    }

    issue(journalEntryId: string, receivableAccount: Account): void {
        if (this.status !== InvoiceStatus.DRAFT) {
            throw new InvoiceAlreadyIssuedError(this.companyId, this.id);
        }
        if (!journalEntryId.trim()) {
            throw new DomainValidationError('Invoice journalEntryId is required');
        }

        this.validateReceivableAccount(receivableAccount);

        this.status = InvoiceStatus.ISSUED;
        this.journalEntryId = journalEntryId;
        this.receivableAccount = receivableAccount;
    }

    getId(): string {
        return this.id;
    }

    getCompanyId(): string {
        return this.companyId;
    }

    getCustomerId(): string {
        return this.customerId;
    }

    getNumber(): string {
        return this.number;
    }

    getIssueDate(): Date {
        return this.issueDate;
    }

    getDueDate(): Date {
        return this.dueDate;
    }

    getLines(): readonly InvoiceLine[] {
        return [...this.lines];
    }

    getTotal(): Money {
        return this.total;
    }

    getStatus(): InvoiceStatus {
        return this.status;
    }

    getJournalEntryId(): string | null {
        return this.journalEntryId;
    }

    getReceivableAccount(): Account | null {
        return this.receivableAccount;
    }
}
