import { Account } from "../account/account";
import { AccountBalanceStrategyFactory } from "../account/account-balance-strategy-factory";
import { JournalEntry } from "../journal/journal-entry";
import { JournalEntryStatus } from "../journal/journal-entry-status";
import { Money } from "../shared/money";


export class Ledger {
    constructor(
        private readonly entries: JournalEntry[],
    ) { }

    getBalance(account: Account): Money {
        const lines = this.entries
            .filter(entry => entry.getStatus() === JournalEntryStatus.POSTED)
            .flatMap(entry => entry.getLines())
            .filter(line => line.getAccount().getId() === account.getId());

        let totalDebit = Money.zero();
        let totalCredit = Money.zero();

        for (const line of lines) {
            totalDebit = totalDebit.add(line.getDebit());
            totalCredit = totalCredit.add(line.getCredit());
        }

        const strategy = AccountBalanceStrategyFactory.create(account.getType());
        return strategy.calculateBalance(totalDebit, totalCredit);
    }
}
