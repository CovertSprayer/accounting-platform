import Decimal from 'decimal.js';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceLine } from '../../domain/invoice/invoice-line';
import { InvoiceStatus } from '../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../domain/invoice/invoice-already-issued.error';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { JournalEntryStatus } from '../../domain/journal/journal-entry-status';
import { Money } from '../../domain/shared/money';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';
import { NotFoundError } from '../shared/not-found.error';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { InMemoryInvoiceRepository } from '../../infrastructure/persistence/in-memory-invoice-repository';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { InMemoryUnitOfWork } from '../../infrastructure/persistence/in-memory-unit-of-work';
import { IssueInvoice, IssueInvoiceInput } from './issue-invoice';

describe('IssueInvoice', () => {
    const companyId = 'company-1';

    const sales = Account.create('sales', companyId, 'Sales Revenue', AccountType.REVENUE);
    const services = Account.create('services', companyId, 'Service Revenue', AccountType.REVENUE);
    const receivable = Account.create('ar', companyId, 'Accounts Receivable', AccountType.ASSET);
    const bank = Account.create('bank', companyId, 'Bank', AccountType.ASSET);

    const line = (quantity: string, unitPrice: string, account: Account) =>
        InvoiceLine.create('Item', new Decimal(quantity), Money.create(unitPrice), account);

    let invoiceRepository: InMemoryInvoiceRepository;
    let journalEntryRepository: InMemoryJournalEntryRepository;
    let accountRepository: InMemoryAccountRepository;
    let useCase: IssueInvoice;

    const input = (overrides: Partial<IssueInvoiceInput> = {}): IssueInvoiceInput => ({
        invoiceId: 'invoice-1',
        receivableAccountId: 'ar',
        journalEntryId: 'journal-1',
        ...overrides,
    });

    const expectNothingPosted = async () => {
        expect(await journalEntryRepository.findAll(companyId)).toEqual([]);
        const invoice = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(invoice?.getStatus()).toBe(InvoiceStatus.DRAFT);
    };

    beforeEach(async () => {
        invoiceRepository = new InMemoryInvoiceRepository();
        journalEntryRepository = new InMemoryJournalEntryRepository();
        accountRepository = new InMemoryAccountRepository();

        for (const account of [sales, services, receivable, bank]) {
            await accountRepository.save(companyId, account);
        }

        // 2 × 100 + 1 × 50 on Sales, 3 × 0.3333 (→ 1.00) on Services: total 251.00
        await invoiceRepository.save(
            companyId,
            Invoice.create({
                id: 'invoice-1',
                companyId,
                customerId: 'customer-1',
                number: 'INV-001',
                issueDate: new Date('2026-10-01'),
                dueDate: new Date('2026-10-31'),
                lines: [
                    line('2', '100', sales),
                    line('3', '0.3333', services),
                    line('1', '50', sales),
                ],
            }),
        );

        useCase = new IssueInvoice(
            invoiceRepository,
            journalEntryRepository,
            accountRepository,
            new InMemoryUnitOfWork(),
        );
    });

    it('should issue the invoice and post a balanced journal entry', async () => {
        const invoice = await useCase.execute(companyId, input());

        expect(invoice.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(invoice.getJournalEntryId()).toBe('journal-1');

        const entry = await journalEntryRepository.findById(companyId, 'journal-1');

        expect(entry).not.toBeNull();
        expect(entry!.getStatus()).toBe(JournalEntryStatus.POSTED);
        expect(entry!.getDate()).toEqual(new Date('2026-10-01'));

        const lines = entry!.getLines().map((l) => ({
            account: l.getAccount().getId(),
            debit: l.getDebit().toString(),
            credit: l.getCredit().toString(),
        }));

        expect(lines).toEqual([
            { account: 'ar', debit: '251.00', credit: '0.00' },
            { account: 'sales', debit: '0.00', credit: '250.00' },
            { account: 'services', debit: '0.00', credit: '1.00' },
        ]);
    });

    it('should save the issued invoice with its receivable account', async () => {
        await useCase.execute(companyId, input());

        const saved = await invoiceRepository.findById(companyId, 'invoice-1');

        expect(saved!.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(saved!.getJournalEntryId()).toBe('journal-1');
        expect(saved!.getReceivableAccount()?.getId()).toBe('ar');
    });

    it('should reject an invoice that does not exist', async () => {
        await expect(
            useCase.execute(companyId, input({ invoiceId: 'missing' })),
        ).rejects.toThrow(NotFoundError);
    });

    it('should not issue an invoice from another company', async () => {
        await expect(useCase.execute('company-2', input())).rejects.toThrow(NotFoundError);
        await expectNothingPosted();
    });

    it('should reject an unknown receivable account', async () => {
        await expect(
            useCase.execute(companyId, input({ receivableAccountId: 'missing' })),
        ).rejects.toThrow('Account not found: missing');
        await expectNothingPosted();
    });

    it('should reject a non-asset receivable account', async () => {
        await expect(
            useCase.execute(companyId, input({ receivableAccountId: 'sales' })),
        ).rejects.toThrow('Invoice receivable account must be an asset account');
        await expectNothingPosted();
    });

    it('should reject an invoice that is already issued without posting again', async () => {
        await useCase.execute(companyId, input());

        await expect(
            useCase.execute(companyId, input({ journalEntryId: 'journal-2' })),
        ).rejects.toThrow(InvoiceAlreadyIssuedError);

        expect(await journalEntryRepository.findAll(companyId)).toHaveLength(1);
    });

    it('should reject a journal entry id that is already used', async () => {
        await journalEntryRepository.save(
            companyId,
            JournalEntry.create('journal-1', companyId, new Date('2026-09-01'), [
                JournalEntryLine.debit(bank, Money.create('10')),
                JournalEntryLine.credit(sales, Money.create('10')),
            ]),
        );

        await expect(useCase.execute(companyId, input())).rejects.toThrow(
            DomainValidationError,
        );

        const existing = await journalEntryRepository.findById(companyId, 'journal-1');
        expect(existing!.getStatus()).toBe(JournalEntryStatus.DRAFT);

        const invoice = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(invoice!.getStatus()).toBe(InvoiceStatus.DRAFT);
    });
});
