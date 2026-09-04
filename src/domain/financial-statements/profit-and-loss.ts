import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { AccountBalanceStrategyFactory } from '../account/account-balance-strategy-factory';
import { JournalEntry } from '../journal/journal-entry';
import { JournalEntryStatus } from '../journal/journal-entry-status';
import { Money } from '../shared/money';

export class ProfitAndLoss {
    private constructor(
        private readonly totalRevenue: Money,
        private readonly totalExpenses: Money,
    ) { }

    static calculate(
        accounts: Account[],
        entries: JournalEntry[],
    ): ProfitAndLoss {
        const postedEntries = entries.filter(
            entry =>
                entry.getStatus() === JournalEntryStatus.POSTED,
        );

        let totalRevenue = Money.zero();
        let totalExpenses = Money.zero();

        for (const account of accounts) {
            const accountType = account.getType();

            if (
                accountType !== AccountType.REVENUE &&
                accountType !== AccountType.EXPENSE
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

            const accountBalance =
                strategy.calculateBalance(
                    totalDebit,
                    totalCredit,
                );

            if (accountType === AccountType.REVENUE) {
                totalRevenue = totalRevenue.add(
                    accountBalance,
                );
            }

            if (accountType === AccountType.EXPENSE) {
                totalExpenses = totalExpenses.add(
                    accountBalance,
                );
            }
        }

        return new ProfitAndLoss(
            totalRevenue,
            totalExpenses,
        );
    }

    getTotalRevenue(): Money {
        return this.totalRevenue;
    }

    getTotalExpenses(): Money {
        return this.totalExpenses;
    }

    getNetProfit(): Money {
        return this.totalRevenue.subtract(
            this.totalExpenses,
        );
    }
}