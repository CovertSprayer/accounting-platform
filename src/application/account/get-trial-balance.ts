import { AccountRepository } from "../../domain/account/account-repository";
import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";
import { TrialBalance } from "../../domain/ledger/trial-balance";

export class GetTrialBalance {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
    ) {}

    async execute(companyId: string): Promise<TrialBalance> {
        const accounts = await this.accountRepository.findAll(companyId);
        const entries = await this.journalEntryRepository.findAll(companyId);

        return TrialBalance.calculate(accounts, entries);
    }
}