import Decimal from 'decimal.js';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceLine } from '../../domain/invoice/invoice-line';
import { Money } from '../../domain/shared/money';
import { InMemoryInvoiceRepository } from '../../infrastructure/persistence/in-memory-invoice-repository';
import { ListInvoices } from './list-invoices';

describe('ListInvoices', () => {
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
                    new Decimal('1'),
                    Money.create('50'),
                    Account.create('sales', companyId, 'Sales', AccountType.REVENUE),
                ),
            ],
        });

    it('should return all invoices for a company only', async () => {
        const repository = new InMemoryInvoiceRepository();
        await repository.save('company-1', createInvoice('company-1', 'invoice-1', 'INV-001'));
        await repository.save('company-1', createInvoice('company-1', 'invoice-2', 'INV-002'));
        await repository.save('company-2', createInvoice('company-2', 'invoice-3', 'INV-001'));

        const result = await new ListInvoices(repository).execute('company-1');

        expect(result.map(invoice => invoice.getId())).toEqual(['invoice-1', 'invoice-2']);
    });

    it('should return an empty array when the company has no invoices', async () => {
        const result = await new ListInvoices(new InMemoryInvoiceRepository()).execute('company-1');

        expect(result).toEqual([]);
    });
});
