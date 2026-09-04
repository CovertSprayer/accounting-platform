import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { AccountBalanceStrategyFactory } from '../account/account-balance-strategy-factory';
import { JournalEntry } from '../journal/journal-entry';
import { JournalEntryStatus } from '../journal/journal-entry-status';
import { Money } from '../shared/money';

export class BalanceSheet {
    private constructor(
        private readonly totalAssets: Money,
        private readonly totalLiabilities: Money,
        private readonly totalEquity: Money,
    ) { }

    static calculate(
        accounts: Account[],
        entries: JournalEntry[],
    ): BalanceSheet {
        const postedEntries = entries.filter(
            entry =>
                entry.getStatus() === JournalEntryStatus.POSTED,
        );

        let totalAssets = Money.zero();
        let totalLiabilities = Money.zero();
        let totalEquity = Money.zero();

        for (const account of accounts) {
            const accountType = account.getType();

            if (
                accountType !== AccountType.ASSET &&
                accountType !== AccountType.LIABILITY &&
                accountType !== AccountType.EQUITY
            ) {
                continue;
            }

            let totalDebit = Money.zero();
            let totalCredit = Money.zero();

            for (const entry of postedEntries) {
                for (const line of entry.getLines()) {
                    if (
                        line.getAccount().getId() !==
                        account.getId()
                    ) {
                        continue;
                    }

                    totalDebit = totalDebit.add(
                        line.getDebit(),
                    );

                    totalCredit = totalCredit.add(
                        line.getCredit(),
                    );
                }
            }

            const strategy =
                AccountBalanceStrategyFactory.create(
                    accountType,
                );

            const balance = strategy.calculateBalance(
                totalDebit,
                totalCredit,
            );

            if (accountType === AccountType.ASSET) {
                totalAssets = totalAssets.add(balance);
            }

            if (accountType === AccountType.LIABILITY) {
                totalLiabilities =
                    totalLiabilities.add(balance);
            }

            if (accountType === AccountType.EQUITY) {
                totalEquity = totalEquity.add(balance);
            }
        }

        return new BalanceSheet(
            totalAssets,
            totalLiabilities,
            totalEquity,
        );
    }

    getTotalAssets(): Money {
        return this.totalAssets;
    }

    getTotalLiabilities(): Money {
        return this.totalLiabilities;
    }

    getTotalEquity(): Money {
        return this.totalEquity;
    }

    getTotalLiabilitiesAndEquity(): Money {
        return this.totalLiabilities.add(
            this.totalEquity,
        );
    }
}