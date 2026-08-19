import Decimal from 'decimal.js';
import { JournalEntryLine } from './journal-entry-line';

export class JournalEntry {
    private constructor(
        private readonly id: string,
        private readonly lines: JournalEntryLine[],
    ) {
        this.validate();
    }

    static create(
        id: string,
        lines: JournalEntryLine[],
    ): JournalEntry {
        return new JournalEntry(id, lines);
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

    getId(): string {
        return this.id;
    }

    getLines(): readonly JournalEntryLine[] {
        return this.lines;
    }
}