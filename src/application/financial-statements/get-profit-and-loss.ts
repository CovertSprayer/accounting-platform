import { AccountRepository } from '../../domain/account/account-repository';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { ProfitAndLoss } from '../../domain/financial-statements/profit-and-loss';

export class GetProfitAndLoss {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
    ) { }

    async execute(companyId: string): Promise<ProfitAndLoss> {
        const accounts = await this.accountRepository.findAll(companyId);

        const entries = await this.journalEntryRepository.findAll(
            companyId,
        );

        return ProfitAndLoss.calculate(accounts, entries);
    }
}