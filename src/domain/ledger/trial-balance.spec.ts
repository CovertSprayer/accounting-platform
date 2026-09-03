import { Account } from "../account/account";
import { AccountType } from "../account/account-type";
import { JournalEntry } from "../journal/journal-entry";
import { JournalEntryLine } from "../journal/journal-entry-line";
import { Money } from "../shared/money";
import { TrialBalance } from "./trial-balance";

describe("TrialBalance", () => {

    it("should calculate debit and credit totals for all accounts", () => {
        const cash = Account.create(
            "cash",
            "company-1",
            "Bank",
            AccountType.ASSET,
        );

        const revenue = Account.create(
            "revenue",
            "company-1",
            "Revenue",
            AccountType.REVENUE,
        );

        const journalEntry = JournalEntry.create(
            "entry-1",
            "company-1",
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create("1000")),
                JournalEntryLine.credit(revenue, Money.create("1000")),
            ]
        );

        journalEntry.post();

        const trialBalance = TrialBalance.calculate(
            [cash, revenue],
            [journalEntry],
        );

        const rows = trialBalance.getRows();

        expect(rows).toHaveLength(2);

        expect(rows[0].accountId).toBe(cash.getId());
        expect(rows[0].debit.toString()).toBe("1000.00");
        expect(rows[0].credit.toString()).toBe("0.00");

        expect(rows[1].accountId).toBe(revenue.getId());
        expect(rows[1].debit.toString()).toBe("0.00");
        expect(rows[1].credit.toString()).toBe("1000.00");

        expect(trialBalance.getTotalDebit().toString()).toBe("1000.00");
        expect(trialBalance.getTotalCredit().toString()).toBe("1000.00");
    });

    it("should ignore draft journal entries", () => {
        const cash = Account.create(
            "cash",
            "company-1",
            "Bank",
            AccountType.ASSET,
        );

        const revenue = Account.create(
            "revenue",
            "company-1",
            "Revenue",
            AccountType.REVENUE,
        );

        const journalEntry = JournalEntry.create(
            "entry-1",
            "company-1",
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create("1000")),
                JournalEntryLine.credit(revenue, Money.create("1000")),
            ],
        );

        const trialBalance = TrialBalance.calculate(
            [cash, revenue],
            [journalEntry],
        );

        expect(trialBalance.getTotalDebit().toString()).toBe("0.00");
        expect(trialBalance.getTotalCredit().toString()).toBe("0.00");
    });
})