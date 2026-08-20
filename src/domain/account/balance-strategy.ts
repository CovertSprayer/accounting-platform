import { Money } from "../shared/money";

export interface AccountBalanceStrategy {
    calculateBalance(
        totalDebit: Money,
        totalCredit: Money,
    ): Money;
}