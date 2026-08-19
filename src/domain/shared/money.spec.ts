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

  it('should reject negative money', () => {
    expect(() => Money.create('-10')).toThrow();
  });

  it('should not allow subtraction resulting in negative money', () => {
    const money1 = Money.create('50');
    const money2 = Money.create('100');

    expect(() => money1.subtract(money2)).toThrow();
  });

  it('should compare money values', () => {
    const money1 = Money.create('100.00');
    const money2 = Money.create('100');

    expect(money1.equals(money2)).toBe(true);
  });
});