import Decimal from 'decimal.js';

export class Money {
  private constructor(
    private readonly amount: Decimal,
  ) {}

  static create(amount: Decimal.Value): Money {
    const decimal = new Decimal(amount);
    return new Money(decimal);
  }

  static zero(): Money {
    return Money.create(0);
  }

  add(other: Money): Money {
    return Money.create(this.amount.plus(other.amount));
  }

  subtract(other: Money): Money {
    const result = this.amount.minus(other.amount);
    return Money.create(result);
  }

  isZero(): boolean {
    return this.amount.isZero();
  }

  isNegative(): boolean {
    return this.amount.isNegative();
  }

  equals(other: Money): boolean {
    return this.amount.equals(other.amount);
  }

  toDecimal(): Decimal {
    return this.amount;
  }

  toString(): string {
    return this.amount.toFixed(2);
  }
}