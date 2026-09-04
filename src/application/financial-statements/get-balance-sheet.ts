import { AccountRepository } from '../../domain/account/account-repository';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { BalanceSheet } from '../../domain/financial-statements/balance-sheet';

export class GetBalanceSheet {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
    ) { }

    async execute(companyId: string, asOfDate: Date): Promise<BalanceSheet> {
        const accounts =
            await this.accountRepository.findAll(companyId);

        const entries =
            await this.journalEntryRepository.findAll(
                companyId,
                undefined,
                asOfDate,
            );

        return BalanceSheet.calculate(accounts, entries);
    }
}