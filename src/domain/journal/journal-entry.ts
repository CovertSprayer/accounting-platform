import Decimal from 'decimal.js';
import { JournalEntryLine } from './journal-entry-line';
import { JournalEntryStatus } from './journal-entry-status';

export class JournalEntry {
    private status: JournalEntryStatus;

    private constructor(
        private readonly id: string,
        private readonly companyId: string,
        private readonly date: Date,
        private readonly lines: JournalEntryLine[],
    ) {
        this.status = JournalEntryStatus.DRAFT;
        this.validate();
    }

    static create(
        id: string,
        companyId: string,
        date: Date,
        lines: JournalEntryLine[],
    ): JournalEntry {
        return new JournalEntry(id, companyId, date, lines);
    }

    static reconstitute(
        id: string,
        companyId: string,
        date: Date,
        lines: JournalEntryLine[],
        status: JournalEntryStatus,
    ): JournalEntry {
        const entry = new JournalEntry(id, companyId, date, lines);
        entry.status = status;
        return entry;
    }

    private validate(): void {
        if (!this.companyId.trim()) {
            throw new Error('Journal entry companyId is required');
        }

        if (this.lines.length < 2) {
            throw new Error(
                'Journal entry must contain at least two lines',
            );
        }

        for (const line of this.lines) {
            if (
                line.getAccount().getCompanyId() !== this.companyId
            ) {
                throw new Error(
                    'Journal entry line account must belong to the same company',
                );
            }
        }

        const totalDebit = this.lines.reduce(
            (total, line) =>
                total.plus(line.getDebit().toDecimal()),
            new Decimal(0),
        );

        const totalCredit = this.lines.reduce(
            (total, line) =>
                total.plus(line.getCredit().toDecimal()),
            new Decimal(0),
        );

        if (!totalDebit.equals(totalCredit)) {
            throw new Error(
                'Journal entry must be balanced',
            );
        }
    }

    post(): void {
        if (this.status === JournalEntryStatus.POSTED) {
            throw new Error(
                'Journal entry is already posted',
            );
        }

        this.status = JournalEntryStatus.POSTED;
    }

    getId(): string {
        return this.id;
    }

    getCompanyId(): string {
        return this.companyId;
    }

    getDate(): Date {
        return this.date;
    }

    getLines(): readonly JournalEntryLine[] {
        return this.lines;
    }

    getStatus(): JournalEntryStatus {
        return this.status;
    }
}