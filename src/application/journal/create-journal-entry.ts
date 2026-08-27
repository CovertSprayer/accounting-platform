import { Account } from "../../domain/account/account";
import { Money } from "../../domain/shared/money";
import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";
import { JournalEntry } from "../../domain/journal/journal-entry";
import { JournalEntryLine } from "../../domain/journal/journal-entry-line";

export interface CreateJournalEntryInput {
    id: string;
    lines: {
        account: Account,
        type: 'DEBIT' | 'CREDIT',
        amount: string,
    }[];
}

export class CreateJournalEntry {
    constructor(
        private readonly repository: JournalEntryRepository,
    ) {}

    async execute(input: CreateJournalEntryInput): Promise<JournalEntry> {
        const lines = input.lines.map(line => {
            const amount = Money.create(line.amount);

            if(line.type === 'DEBIT') {
                return JournalEntryLine.debit(line.account, amount);
            }

            return JournalEntryLine.credit(line.account, amount);

        });

        const journalEntry = JournalEntry.create(input.id, lines);
        await this.repository.save(journalEntry);
        return journalEntry;
    }
}
