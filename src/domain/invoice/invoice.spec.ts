import Decimal from 'decimal.js';
import { Invoice, CreateInvoiceProps } from './invoice';
import { InvoiceLine } from './invoice-line';
import { InvoiceStatus } from './invoice-status';
import { InvoiceAlreadyIssuedError } from './invoice-already-issued.error';
import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { Money } from '../shared/money';
import { DomainValidationError } from '../shared/domain-validation.error';

describe('Invoice', () => {
  const companyId = 'company-1';

  const sales = Account.create('sales', companyId, 'Sales Revenue', AccountType.REVENUE);
  const receivable = Account.create('ar', companyId, 'Accounts Receivable', AccountType.ASSET);

  const line = (quantity: string, unitPrice: string, account: Account = sales) =>
    InvoiceLine.create('Consulting', new Decimal(quantity), Money.create(unitPrice), account);

  const props = (overrides: Partial<CreateInvoiceProps> = {}): CreateInvoiceProps => ({
    id: 'invoice-1',
    companyId,
    customerId: 'customer-1',
    number: 'INV-001',
    issueDate: new Date('2026-10-01'),
    dueDate: new Date('2026-10-31'),
    lines: [line('2', '100')],
    ...overrides,
  });

  it('should create a draft invoice', () => {
    const invoice = Invoice.create(props());

    expect(invoice.getId()).toBe('invoice-1');
    expect(invoice.getCompanyId()).toBe(companyId);
    expect(invoice.getCustomerId()).toBe('customer-1');
    expect(invoice.getNumber()).toBe('INV-001');
    expect(invoice.getStatus()).toBe(InvoiceStatus.DRAFT);
    expect(invoice.getJournalEntryId()).toBeNull();
    expect(invoice.getReceivableAccount()).toBeNull();
    expect(invoice.getTotal().toString()).toBe('200.00');
  });

  it('should total the rounded line amounts', () => {
    // each line: 3 × 0.3333 = 0.9999 → 1.00
    const invoice = Invoice.create(props({
      lines: [line('3', '0.3333'), line('3', '0.3333'), line('3', '0.3333')],
    }));

    expect(invoice.getTotal().toString()).toBe('3.00');
  });

  it('should trim the invoice number', () => {
    expect(Invoice.create(props({ number: '  INV-001  ' })).getNumber()).toBe('INV-001');
  });

  it.each([
    ['companyId', { companyId: ' ' }, 'Invoice companyId is required'],
    ['customerId', { customerId: ' ' }, 'Invoice customerId is required'],
    ['number', { number: ' ' }, 'Invoice number cannot be empty'],
    ['lines', { lines: [] }, 'Invoice must contain at least one line'],
    ['dates', { issueDate: new Date('invalid') }, 'Invoice dates must be valid'],
  ])('should reject invalid %s', (_, overrides, message) => {
    expect(() => Invoice.create(props(overrides))).toThrow(message);
  });

  it('should reject a due date before the issue date', () => {
    expect(() =>
      Invoice.create(props({
        issueDate: new Date('2026-10-10'),
        dueDate: new Date('2026-10-09'),
      })),
    ).toThrow('Invoice due date cannot be before the issue date');
  });

  it('should allow the due date to equal the issue date', () => {
    const date = new Date('2026-10-10');

    expect(() => Invoice.create(props({ issueDate: date, dueDate: date }))).not.toThrow();
  });

  it('should reject a line account from another company', () => {
    const otherSales = Account.create('sales', 'company-2', 'Sales', AccountType.REVENUE);

    expect(() =>
      Invoice.create(props({ lines: [line('1', '10', otherSales)] })),
    ).toThrow('Invoice line account must belong to the same company');
  });

  it('should reject a total above the supported maximum', () => {
    // each line is valid on its own; together they exceed 16 integer digits
    expect(() =>
      Invoice.create(props({
        lines: [line('1', '6000000000000000'), line('1', '6000000000000000')],
      })),
    ).toThrow('Invoice total exceeds the supported maximum');
  });

  it('should not let callers change its lines', () => {
    const lines = [line('1', '10')];
    const invoice = Invoice.create(props({ lines }));

    lines.push(line('1', '20'));
    (invoice.getLines() as InvoiceLine[]).push(line('1', '30'));

    expect(invoice.getLines()).toHaveLength(1);
    expect(invoice.getTotal().toString()).toBe('10.00');
  });

  describe('issue', () => {
    it('should issue a draft invoice', () => {
      const invoice = Invoice.create(props());

      invoice.issue('journal-1', receivable);

      expect(invoice.getStatus()).toBe(InvoiceStatus.ISSUED);
      expect(invoice.getJournalEntryId()).toBe('journal-1');
      expect(invoice.getReceivableAccount()).toBe(receivable);
    });

    it('should reject issuing twice', () => {
      const invoice = Invoice.create(props());
      invoice.issue('journal-1', receivable);

      expect(() => invoice.issue('journal-2', receivable)).toThrow(InvoiceAlreadyIssuedError);
      expect(invoice.getJournalEntryId()).toBe('journal-1');
    });

    it('should reject a non-asset receivable account', () => {
      const invoice = Invoice.create(props());

      expect(() => invoice.issue('journal-1', sales)).toThrow(
        'Invoice receivable account must be an asset account',
      );
      expect(invoice.getStatus()).toBe(InvoiceStatus.DRAFT);
    });

    it('should reject a receivable account from another company', () => {
      const invoice = Invoice.create(props());
      const otherReceivable = Account.create('ar', 'company-2', 'AR', AccountType.ASSET);

      expect(() => invoice.issue('journal-1', otherReceivable)).toThrow(
        'Invoice receivable account must belong to the same company',
      );
    });

    it('should reject an empty journal entry id', () => {
      const invoice = Invoice.create(props());

      expect(() => invoice.issue(' ', receivable)).toThrow(
        'Invoice journalEntryId is required',
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an issued invoice', () => {
      const invoice = Invoice.reconstitute({
        ...props(),
        status: InvoiceStatus.ISSUED,
        journalEntryId: 'journal-1',
        receivableAccount: receivable,
      });

      expect(invoice.getStatus()).toBe(InvoiceStatus.ISSUED);
      expect(invoice.getJournalEntryId()).toBe('journal-1');
    });

    it('should reject an issued invoice without a journal entry', () => {
      expect(() =>
        Invoice.reconstitute({
          ...props(),
          status: InvoiceStatus.ISSUED,
          journalEntryId: null,
          receivableAccount: receivable,
        }),
      ).toThrow('Issued invoice must have a journal entry and receivable account');
    });

    it('should reject a draft invoice with a journal entry', () => {
      expect(() =>
        Invoice.reconstitute({
          ...props(),
          status: InvoiceStatus.DRAFT,
          journalEntryId: 'journal-1',
          receivableAccount: null,
        }),
      ).toThrow('Draft invoice cannot have a journal entry or receivable account');
    });

    it('should reject an out-of-range total', () => {
      expect(() =>
        Invoice.reconstitute({
          ...props({
            lines: [line('1', '6000000000000000'), line('1', '6000000000000000')],
          }),
          status: InvoiceStatus.DRAFT,
          journalEntryId: null,
          receivableAccount: null,
        }),
      ).toThrow(DomainValidationError);
    });
  });
});
