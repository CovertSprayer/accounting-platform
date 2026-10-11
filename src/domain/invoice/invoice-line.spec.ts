import Decimal from 'decimal.js';
import { InvoiceLine } from './invoice-line';
import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { Money } from '../shared/money';
import { DomainValidationError } from '../shared/domain-validation.error';

describe('InvoiceLine', () => {
  const salesAccount = Account.create(
    'sales',
    'company-1',
    'Sales Revenue',
    AccountType.REVENUE,
  );

  const createLine = (
    quantity: string,
    unitPrice: string,
    account: Account = salesAccount,
    description = 'Consulting',
  ) =>
    InvoiceLine.create(
      description,
      new Decimal(quantity),
      Money.create(unitPrice),
      account,
    );

  it('should create a line and calculate its amount', () => {
    const line = createLine('2.5', '19.99');

    expect(line.getDescription()).toBe('Consulting');
    expect(line.getQuantity().toFixed()).toBe('2.5');
    expect(line.getUnitPrice().toDecimal().toFixed()).toBe('19.99');
    expect(line.getRevenueAccount()).toBe(salesAccount);
    expect(line.getAmount().toDecimal().toFixed()).toBe('49.98');
  });

  it('should round the amount half up to cents', () => {
    // 3 × 0.3333 = 0.9999 → 1.00
    expect(createLine('3', '0.3333').getAmount().toString()).toBe('1.00');
    // 0.0001 × 50 = 0.005 → 0.01 (smallest positive amount)
    expect(createLine('0.0001', '50').getAmount().toString()).toBe('0.01');
  });

  it('should trim the description', () => {
    const line = createLine('1', '10', salesAccount, '  Consulting  ');

    expect(line.getDescription()).toBe('Consulting');
  });

  it('should reject an empty description', () => {
    expect(() => createLine('1', '10', salesAccount, '   ')).toThrow(
      'Invoice line description cannot be empty',
    );
  });

  it.each(['0', '-1'])('should reject quantity %s', (quantity) => {
    expect(() => createLine(quantity, '10')).toThrow(
      'Invoice line quantity must be greater than zero',
    );
  });

  it.each(['0', '-10'])('should reject unit price %s', (unitPrice) => {
    expect(() => createLine('1', unitPrice)).toThrow(
      'Invoice line unit price must be greater than zero',
    );
  });

  it('should reject more than 4 decimal places', () => {
    expect(() => createLine('1.00001', '10')).toThrow(
      'Invoice line quantity cannot have more than 4 decimal places',
    );
    expect(() => createLine('1', '10.00001')).toThrow(
      'Invoice line unit price cannot have more than 4 decimal places',
    );
  });

  it('should reject a non-revenue account', () => {
    const bank = Account.create('bank', 'company-1', 'Bank', AccountType.ASSET);

    expect(() => createLine('1', '10', bank)).toThrow(
      'Invoice line account must be a revenue account',
    );
  });

  it('should reject an amount that rounds to zero', () => {
    expect(() => createLine('0.0001', '0.0001')).toThrow(
      'Invoice line amount must be greater than zero after rounding',
    );
  });

  it('should throw DomainValidationError for invalid lines', () => {
    expect(() => createLine('0.0001', '0.0001')).toThrow(DomainValidationError);
  });

  describe('supported range', () => {
    it('should reject quantity above the maximum', () => {
      expect(() => createLine('10000000000000000', '1')).toThrow(
        'Invoice line quantity exceeds the supported maximum',
      );
    });

    it('should reject unit price above the maximum', () => {
      expect(() => createLine('1', '10000000000000000')).toThrow(
        'Invoice line unit price exceeds the supported maximum',
      );
    });

    it('should reject a product above the maximum amount', () => {
      // 10^10 × 10^6 = 10^16, more than 16 integer digits
      expect(() => createLine('10000000000', '1000000')).toThrow(
        'Invoice line amount exceeds the supported maximum',
      );
    });

    it('should accept exactly the maximum amount', () => {
      const line = createLine('1', '9999999999999999.99');

      expect(line.getAmount().toDecimal().toFixed()).toBe('9999999999999999.99');
    });
  });
});
