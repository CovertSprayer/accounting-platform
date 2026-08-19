import { Account } from "../account/account";
import { Money } from "../shared/money";

export class JournalEntryLine {
    private constructor(
        private readonly account: Account,
        private readonly debit: Money,
        private readonly credit: Money,
    ) { }

    private static validateAmount(amount: Money): void {
        if (amount.isZero()) {
            throw new Error(
                'Journal entry line amount must be greater than zero',
            );
        }
    }

    static debit(account: Account, amount: Money): JournalEntryLine {
        JournalEntryLine.validateAmount(amount);
        return new JournalEntryLine(account, amount, Money.zero());
    }

    static credit(account: Account, amount: Money): JournalEntryLine {
        JournalEntryLine.validateAmount(amount);
        return new JournalEntryLine(account, Money.zero(), amount);
    }

    getAccount(): Account {
        return this.account;
    }

    getDebit(): Money {
        return this.debit;
    }

    getCredit(): Money {
        return this.credit;
    }
}

/*
You might be thinking:
Why don't we have a JournalEntryLineType enum?

Something like:
enum EntryType {
  DEBIT,
  CREDIT,
}

We could.

But right now our domain doesn't need it.

We have two valid operations:

JournalEntryLine.debit(...)
JournalEntryLine.credit(...)

The distinction is represented naturally by the object's state.

This is an example of avoiding primitive obsession and unnecessary abstractions.
 */