import Decimal from 'decimal.js';
import { JournalEntryLine } from './journal-entry-line';
import { JournalEntryStatus } from './journal-entry-status';

export class JournalEntry {
    private status: JournalEntryStatus;

    private constructor(
        private readonly id: string,
        private readonly lines: JournalEntryLine[],
    ) {
        this.status = JournalEntryStatus.DRAFT;
        this.validate();
    }

    static create(
        id: string,
        lines: JournalEntryLine[],
    ): JournalEntry {
        return new JournalEntry(id, lines);
    }

    static reconstitute(
        id: string,
        lines: JournalEntryLine[],
        status: JournalEntryStatus,
    ): JournalEntry {
        const entry = new JournalEntry(id,lines);
        entry.status = status;
        return entry;
    }

    private validate(): void {
        if (this.lines.length < 2) {
            throw new Error(
                'Journal entry must contain at least two lines',
            );
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

    getLines(): readonly JournalEntryLine[] {
        return this.lines;
    }

    getStatus(): JournalEntryStatus {
        return this.status;
    }
}