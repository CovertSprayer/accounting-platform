import Decimal from 'decimal.js';
import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { Money } from '../shared/money';
import { DomainValidationError } from '../shared/domain-validation.error';
import {
    MAX_DECIMAL_PLACES,
    MAX_MONEY_AMOUNT,
    MAX_QUANTITY,
    MAX_UNIT_PRICE,
} from './invoice-limits';

export class InvoiceLine {
    private constructor(
        private readonly description: string,
        private readonly quantity: Decimal,
        private readonly unitPrice: Money,
        private readonly revenueAccount: Account,
        private readonly amount: Money,
    ) { }

    static create(
        description: string,
        quantity: Decimal,
        unitPrice: Money,
        revenueAccount: Account,
    ): InvoiceLine {
        if (!description.trim()) {
            throw new DomainValidationError('Invoice line description cannot be empty');
        }

        InvoiceLine.validateQuantity(quantity);
        InvoiceLine.validateUnitPrice(unitPrice);

        if (revenueAccount.getType() !== AccountType.REVENUE) {
            throw new DomainValidationError('Invoice line account must be a revenue account');
        }

        // Round per line, then sum: printed lines add up exactly to the printed total.
        const amount = unitPrice.multiply(quantity).roundToCents();

        if (amount.isZero()) {
            throw new DomainValidationError(
                'Invoice line amount must be greater than zero after rounding',
            );
        }
        if (amount.toDecimal().greaterThan(MAX_MONEY_AMOUNT)) {
            throw new DomainValidationError('Invoice line amount exceeds the supported maximum');
        }

        return new InvoiceLine(
            description.trim(),
            quantity,
            unitPrice,
            revenueAccount,
            amount,
        );
    }

    private static validateQuantity(quantity: Decimal): void {
        if (!quantity.isFinite()) {
            throw new DomainValidationError('Invoice line quantity must be a valid number');
        }
        if (quantity.lessThanOrEqualTo(0)) {
            throw new DomainValidationError('Invoice line quantity must be greater than zero');
        }
        if (quantity.decimalPlaces() > MAX_DECIMAL_PLACES) {
            throw new DomainValidationError(
                `Invoice line quantity cannot have more than ${MAX_DECIMAL_PLACES} decimal places`,
            );
        }
        if (quantity.greaterThan(MAX_QUANTITY)) {
            throw new DomainValidationError('Invoice line quantity exceeds the supported maximum');
        }
    }

    private static validateUnitPrice(unitPrice: Money): void {
        const value = unitPrice.toDecimal();

        if (!value.isFinite()) {
            throw new DomainValidationError('Invoice line unit price must be a valid number');
        }
        if (unitPrice.isZero() || unitPrice.isNegative()) {
            throw new DomainValidationError('Invoice line unit price must be greater than zero');
        }
        if (value.decimalPlaces() > MAX_DECIMAL_PLACES) {
            throw new DomainValidationError(
                `Invoice line unit price cannot have more than ${MAX_DECIMAL_PLACES} decimal places`,
            );
        }
        if (value.greaterThan(MAX_UNIT_PRICE)) {
            throw new DomainValidationError('Invoice line unit price exceeds the supported maximum');
        }
    }

    getDescription(): string {
        return this.description;
    }

    getQuantity(): Decimal {
        return this.quantity;
    }

    getUnitPrice(): Money {
        return this.unitPrice;
    }

    getRevenueAccount(): Account {
        return this.revenueAccount;
    }

    // unitPrice × quantity, rounded half up to cents.
    getAmount(): Money {
        return this.amount;
    }
}
