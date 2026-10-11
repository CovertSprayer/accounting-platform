import Decimal from 'decimal.js';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceLine } from '../../domain/invoice/invoice-line';
import { InvoiceStatus } from '../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../domain/invoice/invoice-already-issued.error';
import { InvoiceNumberAlreadyExistsError } from '../../domain/invoice/invoice-number-already-exists.error';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Money } from '../../domain/shared/money';
import { InMemoryInvoiceRepository } from './in-memory-invoice-repository';

describe('InMemoryInvoiceRepository', () => {
    const accountsFor = (companyId: string) => ({
        sales: Account.create('sales', companyId, 'Sales', AccountType.REVENUE),
        receivable: Account.create('ar', companyId, 'Accounts Receivable', AccountType.ASSET),
    });

    const createInvoice = (companyId: string, id: string, number: string) =>
        Invoice.create({
            id,
            companyId,
            customerId: 'customer-1',
            number,
            issueDate: new Date('2026-10-01'),
            dueDate: new Date('2026-10-31'),
            lines: [
                InvoiceLine.create(
                    'Consulting',
                    new Decimal('2'),
                    Money.create('100'),
                    accountsFor(companyId).sales,
                ),
            ],
        });

    let repository: InMemoryInvoiceRepository;

    beforeEach(() => {
        repository = new InMemoryInvoiceRepository();
    });

    it('should save and retrieve an invoice by id', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        const found = await repository.findById('company-1', 'invoice-1');

        expect(found?.getNumber()).toBe('INV-001');
        expect(found?.getStatus()).toBe(InvoiceStatus.DRAFT);
        expect(found?.getTotal().toString()).toBe('200.00');
        expect(found?.getLines()).toHaveLength(1);
    });

    it('should return null when the invoice does not exist', async () => {
        expect(await repository.findById('company-1', 'missing')).toBeNull();
    });

    it('should not find an invoice from another company', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        expect(await repository.findById('company-2', 'invoice-1')).toBeNull();
        expect(await repository.findByNumber('company-2', 'INV-001')).toBeNull();
    });

    it('should return all invoices for a company only', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));
        await repository.save('company-1', createInvoice('company-1', 'invoice-2', 'INV-002'));
        await repository.save('company-2', createInvoice('company-2', 'invoice-1', 'INV-001'));

        const invoices = await repository.findAll('company-1');

        expect(invoices.map(invoice => invoice.getNumber())).toEqual(['INV-001', 'INV-002']);
    });

    it('should find an invoice by number', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        const found = await repository.findByNumber('company-1', 'INV-001');

        expect(found?.getId()).toBe('invoice-1');
    });

    it('should reject a duplicate invoice number in the same company', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        await expect(
            repository.save('company-1', createInvoice('company-1', 'invoice-2', 'INV-001')),
        ).rejects.toThrow(InvoiceNumberAlreadyExistsError);
    });

    it('should allow the same invoice number in different companies', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        await expect(
            repository.save('company-2', createInvoice('company-2', 'invoice-2', 'INV-001')),
        ).resolves.toBeUndefined();
    });

    it('should persist issuing an invoice', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        const invoice = await repository.findById('company-1', 'invoice-1');
        invoice!.issue('journal-1', accountsFor('company-1').receivable);
        await repository.save('company-1', invoice!);

        const found = await repository.findById('company-1', 'invoice-1');

        expect(found?.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(found?.getJournalEntryId()).toBe('journal-1');
        expect(found?.getReceivableAccount()?.getId()).toBe('ar');
    });

    it('should not persist changes until save is called', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));

        const invoice = await repository.findById('company-1', 'invoice-1');
        invoice!.issue('journal-1', accountsFor('company-1').receivable);

        const found = await repository.findById('company-1', 'invoice-1');

        expect(found?.getStatus()).toBe(InvoiceStatus.DRAFT);
    });

    it('should reject saving a stale copy that issues an already issued invoice', async () => {
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));
        const { receivable } = accountsFor('company-1');

        // two requests load the same draft
        const first = await repository.findById('company-1', 'invoice-1');
        const second = await repository.findById('company-1', 'invoice-1');

        first!.issue('journal-1', receivable);
        second!.issue('journal-2', receivable);

        await repository.save('company-1', first!);

        await expect(repository.save('company-1', second!)).rejects.toThrow(
            InvoiceAlreadyIssuedError,
        );

        const found = await repository.findById('company-1', 'invoice-1');
        expect(found?.getJournalEntryId()).toBe('journal-1');
    });
});
