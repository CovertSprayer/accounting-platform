import { Money } from "../shared/money";
import { AccountBalanceStrategy } from "./account-balance-strategy";

export class DebitNormalBalanceStrategy implements AccountBalanceStrategy {
    calculateBalance(totalDebit: Money, totalCredit: Money): Money {
        return totalDebit.subtract(totalCredit);
    }
}