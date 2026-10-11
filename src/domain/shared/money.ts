import Decimal from 'decimal.js';

// decimal.js rounds results to 20 significant digits by default, which would
// silently cut large products (e.g. quantity × unit price) before we round to cents.
// 40 digits covers the largest supported product exactly: 16 + 16 integer digits + 8 dp.
const ExactDecimal = Decimal.clone({ precision: 40 });

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

  // Exact product, no rounding. Call roundToCents() when a final amount is needed.
  multiply(factor: Decimal.Value): Money {
    const result = new ExactDecimal(this.amount).times(factor);
    return Money.create(new Decimal(result));
  }

  roundToCents(): Money {
    return Money.create(
      this.amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    );
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