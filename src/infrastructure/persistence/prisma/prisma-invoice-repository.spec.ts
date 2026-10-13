import Decimal from 'decimal.js';
import { PrismaService } from '../../database/prisma.service';
import { PrismaTransactionContext } from '../../database/prisma-transaction-context';
import { PrismaInvoiceRepository } from './prisma-invoice-repository';
import { Invoice } from '../../../domain/invoice/invoice';
import { InvoiceLine } from '../../../domain/invoice/invoice-line';
import { InvoiceStatus } from '../../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../../domain/invoice/invoice-already-issued.error';
import { InvoiceNumberAlreadyExistsError } from '../../../domain/invoice/invoice-number-already-exists.error';
import { Account } from '../../../domain/account/account';
import { AccountType } from '../../../domain/account/account-type';
import { Money } from '../../../domain/shared/money';

describe('PrismaInvoiceRepository', () => {
    let prisma: PrismaService;
    let repository: PrismaInvoiceRepository;

    const companyId = 'test-company-invoice-repository';
    const otherCompanyId = 'test-company-invoice-repository-other';
    const companyIds = [companyId, otherCompanyId];

    const accountsFor = (id: string) => ({
        sales: Account.create('sales', id, 'Sales Revenue', AccountType.REVENUE),
        services: Account.create('services', id, 'Service Revenue', AccountType.REVENUE),
        receivable: Account.create('ar', id, 'Accounts Receivable', AccountType.ASSET),
    });

    const { sales, services, receivable } = accountsFor(companyId);

    const line = (quantity: string, unitPrice: string, account: Account = sales, description = 'Consulting') =>
        InvoiceLine.create(description, new Decimal(quantity), Money.create(unitPrice), account);

    const createInvoice = (
        id: string,
        number: string,
        lines: InvoiceLine[] = [line('2', '100')],
        company = companyId,
    ) =>
        Invoice.create({
            id,
            companyId: company,
            customerId: 'customer-1',
            number,
            issueDate: new Date('2026-10-01'),
            dueDate: new Date('2026-10-31'),
            lines,
        });

    // A posted journal entry the invoice can point at once issued.
    const createJournalEntry = async (id: string, company = companyId) => {
        await prisma.journalEntry.create({
            data: {
                id,
                companyId: company,
                date: new Date('2026-10-01'),
                status: 'POSTED',
                lines: {
                    create: [
                        { id: `${id}-dr`, companyId: company, accountId: 'ar', debit: '200', credit: '0' },
                        { id: `${id}-cr`, companyId: company, accountId: 'sales', debit: '0', credit: '200' },
                    ],
                },
            },
        });
    };

    const cleanUp = async () => {
        const where = { companyId: { in: companyIds } };

        await prisma.invoiceLine.deleteMany({ where });
        await prisma.invoice.deleteMany({ where });
        await prisma.journalEntryLine.deleteMany({ where });
        await prisma.journalEntry.deleteMany({ where });
    };

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        repository = new PrismaInvoiceRepository(prisma, new PrismaTransactionContext());

        await cleanUp();
        await prisma.customer.deleteMany({ where: { companyId: { in: companyIds } } });
        await prisma.account.deleteMany({ where: { companyId: { in: companyIds } } });

        for (const id of companyIds) {
            await prisma.company.upsert({
                where: { id },
                update: {},
                create: { id, name: 'Test Invoice Company' },
            });

            await prisma.customer.create({
                data: { id: 'customer-1', companyId: id, name: 'Acme Ltd' },
            });

            await prisma.account.createMany({
                data: Object.values(accountsFor(id)).map((account) => ({
                    id: account.getId(),
                    companyId: id,
                    name: account.getName(),
                    type: account.getType(),
                })),
            });
        }
    });

    beforeEach(async () => {
        await cleanUp();
    });

    afterAll(async () => {
        await cleanUp();
        await prisma.customer.deleteMany({ where: { companyId: { in: companyIds } } });
        await prisma.account.deleteMany({ where: { companyId: { in: companyIds } } });
        await prisma.company.deleteMany({ where: { id: { in: companyIds } } });

        await prisma.$disconnect();
    });

    it('should save and retrieve a draft invoice with its lines', async () => {
        await repository.save(
            companyId,
            createInvoice('invoice-1', 'INV-001', [
                line('2.5', '19.9900', sales, 'First'),
                line('1.2345', '0.1234', services, 'Second'),
                line('3', '0.3333', sales, 'Third'),
            ]),
        );

        const found = await repository.findById(companyId, 'invoice-1');

        expect(found).not.toBeNull();
        expect(found!.getStatus()).toBe(InvoiceStatus.DRAFT);
        expect(found!.getCustomerId()).toBe('customer-1');
        expect(found!.getIssueDate()).toEqual(new Date('2026-10-01'));
        expect(found!.getDueDate()).toEqual(new Date('2026-10-31'));
        expect(found!.getJournalEntryId()).toBeNull();
        expect(found!.getReceivableAccount()).toBeNull();

        const lines = found!.getLines();
        expect(lines.map(l => l.getDescription())).toEqual(['First', 'Second', 'Third']);
        expect(lines[1].getQuantity().toFixed()).toBe('1.2345');
        expect(lines[1].getUnitPrice().toDecimal().toFixed()).toBe('0.1234');
        expect(lines[1].getRevenueAccount().getId()).toBe('services');
        expect(lines[1].getRevenueAccount().getCompanyId()).toBe(companyId);
        expect(lines[1].getRevenueAccount().getType()).toBe(AccountType.REVENUE);

        // 49.975 → 49.98, 0.15233730 → 0.15, 0.9999 → 1.00
        expect(found!.getTotal().toString()).toBe('51.13');
    });

    it('should not find an invoice from another company', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));

        expect(await repository.findById(otherCompanyId, 'invoice-1')).toBeNull();
        expect(await repository.findByNumber(otherCompanyId, 'INV-001')).toBeNull();
    });

    it('should list invoices for a company only', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));
        await repository.save(companyId, createInvoice('invoice-2', 'INV-002'));
        await repository.save(
            otherCompanyId,
            createInvoice('invoice-3', 'INV-001', [line('1', '10', accountsFor(otherCompanyId).sales)], otherCompanyId),
        );

        const invoices = await repository.findAll(companyId);

        expect(invoices.map(invoice => invoice.getId())).toEqual(['invoice-1', 'invoice-2']);
    });

    it('should find an invoice by number', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));

        const found = await repository.findByNumber(companyId, 'INV-001');

        expect(found?.getId()).toBe('invoice-1');
    });

    it('should reject a duplicate invoice number without saving lines', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));

        await expect(
            repository.save(companyId, createInvoice('invoice-2', 'INV-001')),
        ).rejects.toThrow(InvoiceNumberAlreadyExistsError);

        expect(await prisma.invoiceLine.count({ where: { companyId } })).toBe(1);
    });

    it('should save and retrieve an issued invoice', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));
        await createJournalEntry('journal-1');

        const invoice = await repository.findById(companyId, 'invoice-1');
        invoice!.issue('journal-1', receivable);
        await repository.save(companyId, invoice!);

        const found = await repository.findById(companyId, 'invoice-1');

        expect(found!.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(found!.getJournalEntryId()).toBe('journal-1');
        expect(found!.getReceivableAccount()?.getId()).toBe('ar');
        expect(found!.getReceivableAccount()?.getType()).toBe(AccountType.ASSET);
    });

    it('should reject issuing from a stale copy', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));
        await createJournalEntry('journal-1');
        await createJournalEntry('journal-2');

        const first = await repository.findById(companyId, 'invoice-1');
        const second = await repository.findById(companyId, 'invoice-1');
        first!.issue('journal-1', receivable);
        second!.issue('journal-2', receivable);

        await repository.save(companyId, first!);

        await expect(repository.save(companyId, second!)).rejects.toThrow(
            InvoiceAlreadyIssuedError,
        );

        const found = await repository.findById(companyId, 'invoice-1');
        expect(found!.getJournalEntryId()).toBe('journal-1');
    });

    it('should allow only one concurrent request to issue the same invoice', async () => {
        await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));
        await createJournalEntry('journal-1');
        await createJournalEntry('journal-2');

        // Load two independent stale copies while the invoice is still DRAFT.
        const first = await repository.findById(companyId, 'invoice-1');
        const second = await repository.findById(companyId, 'invoice-1');

        first!.issue('journal-1', receivable);
        second!.issue('journal-2', receivable);

        // Both requests race to perform the conditional DRAFT -> ISSUED update.
        const results = await Promise.allSettled([
            repository.save(companyId, first!),
            repository.save(companyId, second!),
        ]);

        const fulfilled = results.filter(
            (result) => result.status === 'fulfilled',
        );
        const rejected = results.filter(
            (result) => result.status === 'rejected',
        );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const rejectedResult = rejected[0];
        expect(rejectedResult.status).toBe('rejected');
        if (rejectedResult.status === 'rejected') {
            expect(rejectedResult.reason).toBeInstanceOf(InvoiceAlreadyIssuedError);
        }

        const found = await repository.findById(companyId, 'invoice-1');
        expect(found!.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(['journal-1', 'journal-2']).toContain(found!.getJournalEntryId());
    });

    it('should allow only one concurrent create for the same company and invoice number', async () => {
        // Different invoice IDs mean both requests can initially observe no row
        // for their own ID. The database's company+number unique constraint
        // must arbitrate the race.
        const results = await Promise.allSettled([
            repository.save(companyId, createInvoice('invoice-1', 'INV-RACE')),
            repository.save(companyId, createInvoice('invoice-2', 'INV-RACE')),
        ]);

        const fulfilled = results.filter(
            (result) => result.status === 'fulfilled',
        );
        const rejected = results.filter(
            (result) => result.status === 'rejected',
        );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const rejectedResult = rejected[0];
        expect(rejectedResult.status).toBe('rejected');
        if (rejectedResult.status === 'rejected') {
            expect(rejectedResult.reason).toBeInstanceOf(
                InvoiceNumberAlreadyExistsError,
            );
        }

        const matchingInvoices = await prisma.invoice.findMany({
            where: { companyId, number: 'INV-RACE' },
            include: { lines: true },
        });

        expect(matchingInvoices).toHaveLength(1);
        expect(matchingInvoices[0].lines).toHaveLength(1);
    });

    it('should save and reload the maximum supported total exactly', async () => {
        await repository.save(
            companyId,
            createInvoice('invoice-1', 'INV-001', [line('1', '9999999999999999.99')]),
        );

        const found = await repository.findById(companyId, 'invoice-1');

        expect(found!.getTotal().toDecimal().toFixed()).toBe('9999999999999999.99');
    });

    describe('database constraints', () => {
        it('should reject linking an invoice to another company\'s journal entry', async () => {
            await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));
            await createJournalEntry('other-journal', otherCompanyId);

            await expect(
                prisma.invoice.update({
                    where: { companyId_id: { companyId, id: 'invoice-1' } },
                    data: { status: 'ISSUED', journalEntryId: 'other-journal', receivableAccountId: 'ar' },
                }),
            ).rejects.toMatchObject({ code: 'P2003' });
        });

        it('should reject an issued invoice without a journal entry', async () => {
            await repository.save(companyId, createInvoice('invoice-1', 'INV-001'));

            await expect(
                prisma.invoice.update({
                    where: { companyId_id: { companyId, id: 'invoice-1' } },
                    data: { status: 'ISSUED', receivableAccountId: 'ar' },
                }),
            ).rejects.toThrow(/Invoice_issued_consistency_check/);
        });
    });
});
