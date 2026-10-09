import { Customer } from './customer';
import { DomainValidationError } from '../shared/domain-validation.error';

describe('Customer', () => {
  it('should create a customer with all fields', () => {
    const customer = Customer.create(
      'customer-1',
      'company-1',
      'Acme Ltd',
      'ap@acme.com',
      '+1 555 0100',
    );

    expect(customer.getId()).toBe('customer-1');
    expect(customer.getCompanyId()).toBe('company-1');
    expect(customer.getName()).toBe('Acme Ltd');
    expect(customer.getEmail()).toBe('ap@acme.com');
    expect(customer.getPhone()).toBe('+1 555 0100');
  });

  it('should default email and phone to null when not provided', () => {
    const customer = Customer.create('customer-1', 'company-1', 'Acme Ltd');

    expect(customer.getEmail()).toBeNull();
    expect(customer.getPhone()).toBeNull();
  });

  it('should accept explicit null email and phone', () => {
    const customer = Customer.create(
      'customer-1',
      'company-1',
      'Acme Ltd',
      null,
      null,
    );

    expect(customer.getEmail()).toBeNull();
    expect(customer.getPhone()).toBeNull();
  });

  it('should trim the name', () => {
    const customer = Customer.create('customer-1', 'company-1', '  Acme Ltd  ');

    expect(customer.getName()).toBe('Acme Ltd');
  });

  it('should trim and lowercase the email', () => {
    const customer = Customer.create(
      'customer-1',
      'company-1',
      'Acme Ltd',
      '  AP@Acme.COM ',
    );

    expect(customer.getEmail()).toBe('ap@acme.com');
  });

  it('should trim the phone without enforcing a format', () => {
    const customer = Customer.create(
      'customer-1',
      'company-1',
      'Acme Ltd',
      undefined,
      '  ext. 42  ',
    );

    expect(customer.getPhone()).toBe('ext. 42');
  });

  it('should reject empty company id', () => {
    expect(() =>
      Customer.create('customer-1', '  ', 'Acme Ltd'),
    ).toThrow('Company ID cannot be empty');
  });

  it('should reject empty name', () => {
    expect(() =>
      Customer.create('customer-1', 'company-1', '   '),
    ).toThrow('Customer name cannot be empty');
  });

  it('should reject blank email', () => {
    expect(() =>
      Customer.create('customer-1', 'company-1', 'Acme Ltd', '   '),
    ).toThrow('Customer email cannot be empty');
  });

  it.each(['not-an-email', 'a@b', '@acme.com', 'ap@', 'a p@acme.com'])(
    'should reject invalid email %p',
    (email) => {
      expect(() =>
        Customer.create('customer-1', 'company-1', 'Acme Ltd', email),
      ).toThrow('Invalid customer email');
    },
  );

  it('should reject blank phone', () => {
    expect(() =>
      Customer.create('customer-1', 'company-1', 'Acme Ltd', null, '   '),
    ).toThrow('Customer phone cannot be empty');
  });

  it('should signal rule violations with DomainValidationError', () => {
    expect(() =>
      Customer.create('customer-1', 'company-1', '   '),
    ).toThrow(DomainValidationError);
  });
});
