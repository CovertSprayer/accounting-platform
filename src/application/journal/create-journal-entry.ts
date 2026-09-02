import { Account } from "../../domain/account/account";
import { Money } from "../../domain/shared/money";
import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";
import { JournalEntry } from "../../domain/journal/journal-entry";
import { JournalEntryLine } from "../../domain/journal/journal-entry-line";
import { AccountRepository } from "src/domain/account/account-repository";

export interface CreateJournalEntryInput {
    id: string;
    lines: {
        accountId: string,
        type: 'DEBIT' | 'CREDIT',
        amount: string,
    }[];
}

export class CreateJournalEntry {
    constructor(
        private readonly repository: JournalEntryRepository,
        private readonly accountRepository: AccountRepository,
    ) { }

    async execute(companyId: string, input: CreateJournalEntryInput): Promise<JournalEntry> {
        const lines = await Promise.all(
            input.lines.map(async line => {
                const account = await this.accountRepository.findById(
                    companyId,
                    line.accountId,
                );

                if (!account) {
                    throw new Error(`Account not found: ${line.accountId}`);
                }
                
                const amount = Money.create(line.amount);

                if (line.type === 'DEBIT') {
                    return JournalEntryLine.debit(account, amount);
                }

                return JournalEntryLine.credit(account, amount);
            })
        );

        const journalEntry = JournalEntry.create(input.id, lines);
        await this.repository.save(companyId, journalEntry);
        return journalEntry;
    }
}
