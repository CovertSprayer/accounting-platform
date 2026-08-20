import { Money } from "../shared/money";
import { CreditNormalBalanceStrategy } from "./credit-normal-balance-strategy";
import { DebitNormalBalanceStrategy } from "./debit-normal-balance-strategy";


describe('Account Balance Strategy', () => {
    describe('DebitNormalBalanceStrategy', () => {
        it('should calculate debit minus credit', () => {
            const strategy = new DebitNormalBalanceStrategy();

            const balance = strategy.calculateBalance(
                Money.create('10000'),
                Money.create('3000'),
            );

            expect(balance.toString()).toBe('7000.00');
        })
    })

    describe('CreditNormalBalanceStrategy', () => {
        it('should calculate credit minus debit', () => {
            const strategy = new CreditNormalBalanceStrategy();

            const balance = strategy.calculateBalance(
                Money.create('3000'),
                Money.create('10000'),
            );

            expect(balance.toString()).toBe('7000.00');
        })
    })
})