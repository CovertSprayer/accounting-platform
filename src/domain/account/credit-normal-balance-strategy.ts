import { Money } from '../shared/money';
import { AccountBalanceStrategy } from './account-balance-strategy';

export class CreditNormalBalanceStrategy implements AccountBalanceStrategy {
    calculateBalance(totalDebit: Money, totalCredit: Money): Money {
        return totalCredit.subtract(totalDebit);
    }
}