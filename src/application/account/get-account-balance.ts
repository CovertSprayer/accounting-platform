import { AccountRepository } from "../../domain/account/account-repository";
import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";
import { Ledger } from "../../domain/ledger/ledger";
import { Money } from "../../domain/shared/money";

export class GetAccountBalance {
    constructor(
        private readonly repository: AccountRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
    ) { }
    async execute(companyId: string, accountId: string): Promise<Money> {
        const account = await this.repository.findById(companyId, accountId);

        if (!account) {
            throw new Error(`Account not found: ${accountId}`);
        }

        const journalEntries = await this.journalEntryRepository.findAll(companyId);
        const ledger = new Ledger(journalEntries);
        return ledger.getBalance(account);
    }
}