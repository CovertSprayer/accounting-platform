import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Customer } from '../../domain/customer/customer';
import { InvoiceStatus } from '../../domain/invoice/invoice-status';
import { InvoiceNumberAlreadyExistsError } from '../../domain/invoice/invoice-number-already-exists.error';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { InMemoryCustomerRepository } from '../../infrastructure/persistence/in-memory-customer-repository';
import { InMemoryInvoiceRepository } from '../../infrastructure/persistence/in-memory-invoice-repository';
import { CreateInvoice, CreateInvoiceInput } from './create-invoice';

describe('CreateInvoice', () => {
    const companyId = 'company-1';

    let invoiceRepository: InMemoryInvoiceRepository;
    let customerRepository: InMemoryCustomerRepository;
    let accountRepository: InMemoryAccountRepository;
    let useCase: CreateInvoice;

    const input = (overrides: Partial<CreateInvoiceInput> = {}): CreateInvoiceInput => ({
        id: 'invoice-1',
        customerId: 'customer-1',
        number: 'INV-001',
        issueDate: new Date('2026-10-01'),
        dueDate: new Date('2026-10-31'),
        lines: [
            { description: 'Consulting', quantity: '2.5', unitPrice: '19.99', revenueAccountId: 'sales' },
            { description: 'Support', quantity: '1', unitPrice: '100', revenueAccountId: 'sales' },
        ],
        ...overrides,
    });

    const line = (quantity: string, unitPrice: string, revenueAccountId = 'sales') => ({
        description: 'Consulting',
        quantity,
        unitPrice,
        revenueAccountId,
    });

    beforeEach(async () => {
        invoiceRepository = new InMemoryInvoiceRepository();
        customerRepository = new InMemoryCustomerRepository();
        accountRepository = new InMemoryAccountRepository();

        await customerRepository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd'),
        );
        await accountRepository.save(
            companyId,
            Account.create('sales', companyId, 'Sales Revenue', AccountType.REVENUE),
        );

        // Same ids in another company, to prove lookups are company-scoped.
        await customerRepository.save(
            'company-2',
            Customer.create('other-customer', 'company-2', 'Globex'),
        );
        await accountRepository.save(
            'company-2',
            Account.create('other-sales', 'company-2', 'Sales', AccountType.REVENUE),
        );

        useCase = new CreateInvoice(invoiceRepository, customerRepository, accountRepository);
    });

    const expectNothingSaved = async () => {
        expect(await invoiceRepository.findAll(companyId)).toEqual([]);
    };

    it('should create and save a draft invoice', async () => {
        const invoice = await useCase.execute(companyId, input());

        expect(invoice.getStatus()).toBe(InvoiceStatus.DRAFT);
        expect(invoice.getCustomerId()).toBe('customer-1');
        expect(invoice.getLines()).toHaveLength(2);
        // 2.5 × 19.99 = 49.975 → 49.98, plus 100.00
        expect(invoice.getTotal().toString()).toBe('149.98');

        const saved = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(saved?.getNumber()).toBe('INV-001');
        expect(saved?.getTotal().toString()).toBe('149.98');
    });

    it('should reject an unknown customer', async () => {
        await expect(
            useCase.execute(companyId, input({ customerId: 'missing' })),
        ).rejects.toThrow('Customer not found: missing');
        await expectNothingSaved();
    });

    it('should reject a customer from another company', async () => {
        await expect(
            useCase.execute(companyId, input({ customerId: 'other-customer' })),
        ).rejects.toThrow('Customer not found: other-customer');
        await expectNothingSaved();
    });

    it('should reject an unknown revenue account', async () => {
        await expect(
            useCase.execute(companyId, input({ lines: [line('1', '10', 'missing')] })),
        ).rejects.toThrow('Account not found: missing');
        await expectNothingSaved();
    });

    it('should reject a revenue account from another company', async () => {
        await expect(
            useCase.execute(companyId, input({ lines: [line('1', '10', 'other-sales')] })),
        ).rejects.toThrow('Account not found: other-sales');
        await expectNothingSaved();
    });

    it('should reject a duplicate invoice number', async () => {
        await useCase.execute(companyId, input());

        await expect(
            useCase.execute(companyId, input({ id: 'invoice-2' })),
        ).rejects.toThrow(InvoiceNumberAlreadyExistsError);

        expect(await invoiceRepository.findAll(companyId)).toHaveLength(1);
    });

    it('should reject non-numeric quantities as a domain error', async () => {
        await expect(
            useCase.execute(companyId, input({ lines: [line('abc', '10')] })),
        ).rejects.toThrow(DomainValidationError);
        await expectNothingSaved();
    });

    it('should reject a line that rounds to zero before saving', async () => {
        await expect(
            useCase.execute(companyId, input({ lines: [line('0.0001', '0.0001')] })),
        ).rejects.toThrow('Invoice line amount must be greater than zero after rounding');
        await expectNothingSaved();
    });

    it('should reject a total above the supported maximum before saving', async () => {
        await expect(
            useCase.execute(companyId, input({
                lines: [line('1', '6000000000000000'), line('1', '6000000000000000')],
            })),
        ).rejects.toThrow('Invoice total exceeds the supported maximum');
        await expectNothingSaved();
    });
});
