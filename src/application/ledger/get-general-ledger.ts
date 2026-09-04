import { AccountRepository } from '../../domain/account/account-repository';
import { AccountBalanceStrategyFactory } from '../../domain/account/account-balance-strategy-factory';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { JournalEntryStatus } from '../../domain/journal/journal-entry-status';
import { Money } from '../../domain/shared/money';

export interface GeneralLedgerEntry {
    journalEntryId: string;
    date: Date;
    debit: Money;
    credit: Money;
    balance: Money;
}

export interface GeneralLedger {
    accountId: string;
    accountName: string;
    entries: GeneralLedgerEntry[];
}

export class GetGeneralLedger {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly journalEntryRepository: JournalEntryRepository,
    ) { }

    async execute(
        companyId: string,
        accountId: string,
    ): Promise<GeneralLedger> {
        const account = await this.accountRepository.findById(
            companyId,
            accountId,
        );

        if (!account) {
            throw new Error(`Account not found: ${accountId}`);
        }

        const entries = await this.journalEntryRepository.findAll(
            companyId,
        );

        const postedEntries = entries
            .filter(
                entry =>
                    entry.getStatus() === JournalEntryStatus.POSTED,
            )
            .sort(
                (a, b) =>
                    a.getDate().getTime() -
                    b.getDate().getTime() ||
                    a.getId().localeCompare(b.getId()),
            );

        const strategy = AccountBalanceStrategyFactory.create(
            account.getType(),
        );

        let totalDebit = Money.zero();
        let totalCredit = Money.zero();

        const ledgerEntries: GeneralLedgerEntry[] = [];

        for (const entry of postedEntries) {
            for (const line of entry.getLines()) {
                if (
                    line.getAccount().getId() !== account.getId()
                ) {
                    continue;
                }

                totalDebit = totalDebit.add(line.getDebit());
                totalCredit = totalCredit.add(line.getCredit());

                const balance = strategy.calculateBalance(
                    totalDebit,
                    totalCredit,
                );

                ledgerEntries.push({
                    journalEntryId: entry.getId(),
                    date: entry.getDate(),
                    debit: line.getDebit(),
                    credit: line.getCredit(),
                    balance,
                });
            }
        }

        return {
            accountId: account.getId(),
            accountName: account.getName(),
            entries: ledgerEntries,
        };
    }
}