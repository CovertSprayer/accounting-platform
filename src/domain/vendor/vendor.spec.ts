import { Vendor } from './vendor';
import { DomainValidationError } from '../shared/domain-validation.error';

describe('Vendor', () => {
  it('should create a vendor with all fields', () => {
    const vendor = Vendor.create(
      'vendor-1',
      'company-1',
      'Office Supplies Co',
      'billing@supplies.com',
      '+1 555 0100',
    );

    expect(vendor.getId()).toBe('vendor-1');
    expect(vendor.getCompanyId()).toBe('company-1');
    expect(vendor.getName()).toBe('Office Supplies Co');
    expect(vendor.getEmail()).toBe('billing@supplies.com');
    expect(vendor.getPhone()).toBe('+1 555 0100');
  });

  it('should default email and phone to null when not provided', () => {
    const vendor = Vendor.create('vendor-1', 'company-1', 'Office Supplies Co');

    expect(vendor.getEmail()).toBeNull();
    expect(vendor.getPhone()).toBeNull();
  });

  it('should accept explicit null email and phone', () => {
    const vendor = Vendor.create(
      'vendor-1',
      'company-1',
      'Office Supplies Co',
      null,
      null,
    );

    expect(vendor.getEmail()).toBeNull();
    expect(vendor.getPhone()).toBeNull();
  });

  it('should trim the name', () => {
    const vendor = Vendor.create('vendor-1', 'company-1', '  Office Supplies Co  ');

    expect(vendor.getName()).toBe('Office Supplies Co');
  });

  it('should trim and lowercase the email', () => {
    const vendor = Vendor.create(
      'vendor-1',
      'company-1',
      'Office Supplies Co',
      '  BILLING@Supplies.COM ',
    );

    expect(vendor.getEmail()).toBe('billing@supplies.com');
  });

  it('should trim the phone without enforcing a format', () => {
    const vendor = Vendor.create(
      'vendor-1',
      'company-1',
      'Office Supplies Co',
      undefined,
      '  ext. 42  ',
    );

    expect(vendor.getPhone()).toBe('ext. 42');
  });

  it('should reject empty company id', () => {
    expect(() =>
      Vendor.create('vendor-1', '  ', 'Office Supplies Co'),
    ).toThrow('Company ID cannot be empty');
  });

  it('should reject empty name', () => {
    expect(() =>
      Vendor.create('vendor-1', 'company-1', '   '),
    ).toThrow('Vendor name cannot be empty');
  });

  it('should reject blank email', () => {
    expect(() =>
      Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', '   '),
    ).toThrow('Vendor email cannot be empty');
  });

  it.each(['not-an-email', 'a@b', '@supplies.com', 'billing@', 'a b@supplies.com'])(
    'should reject invalid email %p',
    (email) => {
      expect(() =>
        Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', email),
      ).toThrow('Invalid vendor email');
    },
  );

  it('should reject blank phone', () => {
    expect(() =>
      Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', null, '   '),
    ).toThrow('Vendor phone cannot be empty');
  });

  it('should signal rule violations with DomainValidationError', () => {
    expect(() =>
      Vendor.create('vendor-1', 'company-1', '   '),
    ).toThrow(DomainValidationError);
  });
});
