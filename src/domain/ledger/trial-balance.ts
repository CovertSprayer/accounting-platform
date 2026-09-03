import { Account } from "../account/account";
import { JournalEntry } from "../journal/journal-entry";
import { JournalEntryStatus } from "../journal/journal-entry-status";
import { Money } from "../shared/money";

export interface TrialBalanceRow {
    accountId: string;
    accountName: string;
    debit: Money;
    credit: Money;
}

export class TrialBalance {
    private constructor(
        private readonly rows: TrialBalanceRow[],
    ) {}

    static calculate(
        accounts: Account[],
        entries: JournalEntry[],
    ): TrialBalance {
        const postedEntries = entries.filter(
            entry => entry.getStatus() === JournalEntryStatus.POSTED
        );

        const rows = accounts.map(account => {
            let debit = Money.zero();
            let credit = Money.zero();

            for(const entry of postedEntries) {
                for(const line of entry.getLines()) {
                    if(
                        line.getAccount().getId() !== account.getId() ||
                        line.getAccount().getCompanyId() !== account.getCompanyId()
                    ) {
                        continue;
                    }

                    debit = debit.add(line.getDebit());
                    credit = credit.add(line.getCredit());
                }
            }

            return {
                accountId: account.getId(),
                accountName: account.getName(),
                debit,
                credit,
            }
        })

        return new TrialBalance(rows);
    }

    getRows(): readonly TrialBalanceRow[] {
        return this.rows;
    }

    getTotalDebit(): Money {
        return this.rows.reduce(
            (total, row) => total.add(row.debit),
            Money.zero(),
        );
    }

    getTotalCredit(): Money {
        return this.rows.reduce(
            (total, row) => total.add(row.credit),
            Money.zero(),
        );
    }
}