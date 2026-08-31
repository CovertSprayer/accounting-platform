import { AccountType } from './account-type';
import { AccountBalanceStrategy } from './account-balance-strategy';
import { CreditNormalBalanceStrategy } from './credit-normal-balance-strategy';
import { DebitNormalBalanceStrategy } from './debit-normal-balance-strategy';

export class AccountBalanceStrategyFactory {
    static create(accountType: AccountType): AccountBalanceStrategy {
        switch (accountType) {
            case AccountType.ASSET:
            case AccountType.EXPENSE:
                return new DebitNormalBalanceStrategy();

            case AccountType.LIABILITY:
            case AccountType.EQUITY:
            case AccountType.REVENUE:
                return new CreditNormalBalanceStrategy();
                
            default:
                throw new Error(
                    `Unsupported account type: ${accountType}`,
                );
        }
    }
}