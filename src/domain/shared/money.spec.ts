import { Money } from './money';

describe('Money', () => {
  it('should create money', () => {
    const money = Money.create('100.50');

    expect(money.toString()).toBe('100.50');
  });

  it('should add money', () => {
    const money1 = Money.create('100.50');
    const money2 = Money.create('50.25');

    const result = money1.add(money2);

    expect(result.toString()).toBe('150.75');
  });

  it('should subtract money', () => {
    const money1 = Money.create('100.50');
    const money2 = Money.create('50.25');

    const result = money1.subtract(money2);

    expect(result.toString()).toBe('50.25');
  });

  it('should allow negative money', () => {
    const money = Money.create('-100');

    expect(money.toString()).toBe('-100.00');
  });

  it('should allow subtraction resulting in negative money', () => {
    const money1 = Money.create('50');
    const money2 = Money.create('100');

    expect(money1.subtract(money2).toString()).toBe('-50.00');
  });

  it('should compare money values', () => {
    const money1 = Money.create('100.00');
    const money2 = Money.create('100');

    expect(money1.equals(money2)).toBe(true);
  });

  describe('multiply', () => {
    it('should multiply by a decimal factor without rounding', () => {
      const result = Money.create('19.9900').multiply('2.5');

      expect(result.toDecimal().toFixed()).toBe('49.975');
    });

    it('should keep digits that default decimal.js precision would cut', () => {
      const result = Money.create('1234567890123.4567').multiply('1.2345');

      expect(result.toDecimal().toFixed()).toBe('1524074060357.40729615');
    });

    it('should multiply the largest supported values exactly', () => {
      const result = Money.create('9999999999999999.9999')
        .multiply('9999999999999999.9999');

      expect(result.toDecimal().toFixed()).toBe(
        '99999999999999999998000000000000.00000001',
      );
    });

    it('should not change the original money', () => {
      const money = Money.create('10');

      money.multiply('3');

      expect(money.toString()).toBe('10.00');
    });
  });

  describe('roundToCents', () => {
    it('should round half up', () => {
      expect(Money.create('0.125').roundToCents().toDecimal().toFixed()).toBe('0.13');
      expect(Money.create('1.005').roundToCents().toDecimal().toFixed()).toBe('1.01');
    });

    it('should round down below half', () => {
      expect(Money.create('0.124').roundToCents().toDecimal().toFixed()).toBe('0.12');
    });

    it('should round tiny amounts to zero', () => {
      const result = Money.create('0.0001').multiply('0.0001').roundToCents();

      expect(result.isZero()).toBe(true);
    });

    it('should round a large exact product correctly', () => {
      const result = Money.create('1234567890123.4567')
        .multiply('1.2345')
        .roundToCents();

      expect(result.toDecimal().toFixed()).toBe('1524074060357.41');
    });
  });
});