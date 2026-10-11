import Decimal from 'decimal.js';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceLine } from '../../domain/invoice/invoice-line';
import { Money } from '../../domain/shared/money';
import { InMemoryInvoiceRepository } from '../../infrastructure/persistence/in-memory-invoice-repository';
import { GetInvoice } from './get-invoice';

describe('GetInvoice', () => {
    const sales = Account.create('sales', 'company-1', 'Sales', AccountType.REVENUE);

    const invoice = Invoice.create({
        id: 'invoice-1',
        companyId: 'company-1',
        customerId: 'customer-1',
        number: 'INV-001',
        issueDate: new Date('2026-10-01'),
        dueDate: new Date('2026-10-31'),
        lines: [InvoiceLine.create('Consulting', new Decimal('1'), Money.create('50'), sales)],
    });

    it('should return an invoice by id', async () => {
        const repository = new InMemoryInvoiceRepository();
        await repository.save('company-1', invoice);

        const result = await new GetInvoice(repository).execute('company-1', 'invoice-1');

        expect(result?.getNumber()).toBe('INV-001');
        expect(result?.getTotal().toString()).toBe('50.00');
    });

    it('should return null when the invoice does not exist', async () => {
        const repository = new InMemoryInvoiceRepository();

        const result = await new GetInvoice(repository).execute('company-1', 'missing');

        expect(result).toBeNull();
    });

    it('should not return an invoice belonging to another company', async () => {
        const repository = new InMemoryInvoiceRepository();
        await repository.save('company-1', invoice);

        const result = await new GetInvoice(repository).execute('company-2', 'invoice-1');

        expect(result).toBeNull();
    });
});
