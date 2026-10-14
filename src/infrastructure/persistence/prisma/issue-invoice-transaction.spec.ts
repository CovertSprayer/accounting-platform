import Decimal from 'decimal.js';
import { PrismaService } from '../../database/prisma.service';
import { PrismaTransactionContext } from '../../database/prisma-transaction-context';
import { PrismaUnitOfWork } from '../../database/prisma-unit-of-work';
import { PrismaInvoiceRepository } from './prisma-invoice-repository';
import { PrismaJournalEntryRepository } from './prisma-journal-entry-repository';
import { PrismaAccountRepository } from './prisma-account-repository';
import { IssueInvoice } from '../../../application/invoice/issue-invoice';
import { Invoice } from '../../../domain/invoice/invoice';
import { InvoiceLine } from '../../../domain/invoice/invoice-line';
import { InvoiceStatus } from '../../../domain/invoice/invoice-status';
import { InvoiceAlreadyIssuedError } from '../../../domain/invoice/invoice-already-issued.error';
import { Account } from '../../../domain/account/account';
import { AccountType } from '../../../domain/account/account-type';
import { Money } from '../../../domain/shared/money';

// IssueInvoice against real Postgres: proves the unit of work keeps the
// journal entry and the invoice update atomic, including under concurrency.
describe('IssueInvoice with Prisma', () => {
    let prisma: PrismaService;
    let invoiceRepository: PrismaInvoiceRepository;
    let useCase: IssueInvoice;

    const companyId = 'test-company-issue-invoice';
    const sales = Account.create('sales', companyId, 'Sales Revenue', AccountType.REVENUE);

    const cleanUp = async () => {
        const where = { companyId };

        await prisma.invoiceLine.deleteMany({ where });
        await prisma.invoice.deleteMany({ where });
        await prisma.journalEntryLine.deleteMany({ where });
        await prisma.journalEntry.deleteMany({ where });
    };

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        const context = new PrismaTransactionContext();
        invoiceRepository = new PrismaInvoiceRepository(prisma, context);

        useCase = new IssueInvoice(
            invoiceRepository,
            new PrismaJournalEntryRepository(prisma, context),
            new PrismaAccountRepository(prisma),
            new PrismaUnitOfWork(prisma, context),
        );

        await cleanUp();
        await prisma.customer.deleteMany({ where: { companyId } });
        await prisma.account.deleteMany({ where: { companyId } });
        await prisma.company.upsert({
            where: { id: companyId },
            update: {},
            create: { id: companyId, name: 'Test Issue Invoice Company' },
        });
        await prisma.customer.create({
            data: { id: 'customer-1', companyId, name: 'Acme Ltd' },
        });
        await prisma.account.createMany({
            data: [
                { id: 'sales', companyId, name: 'Sales Revenue', type: 'REVENUE' },
                { id: 'ar', companyId, name: 'Accounts Receivable', type: 'ASSET' },
            ],
        });
    });

    beforeEach(async () => {
        await cleanUp();

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
                    InvoiceLine.create('Consulting', new Decimal('2'), Money.create('100'), sales),
                ],
            }),
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await cleanUp();
        await prisma.customer.deleteMany({ where: { companyId } });
        await prisma.account.deleteMany({ where: { companyId } });
        await prisma.company.deleteMany({ where: { id: companyId } });
        await prisma.$disconnect();
    });

    const issue = (journalEntryId: string) =>
        useCase.execute(companyId, {
            invoiceId: 'invoice-1',
            receivableAccountId: 'ar',
            journalEntryId,
        });

    it('should post the journal entry and issue the invoice', async () => {
        await issue('journal-1');

        const entry = await prisma.journalEntry.findUnique({
            where: { id: 'journal-1' },
            include: { lines: true },
        });

        expect(entry!.status).toBe('POSTED');
        expect(entry!.lines).toHaveLength(2);

        const invoice = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(invoice!.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(invoice!.getJournalEntryId()).toBe('journal-1');
    });

    it('should roll back the journal entry when saving the invoice fails', async () => {
        const failure = new Error('invoice save failed');
        jest.spyOn(invoiceRepository, 'save').mockRejectedValueOnce(failure);

        await expect(issue('journal-1')).rejects.toBe(failure);

        expect(await prisma.journalEntry.count({ where: { companyId } })).toBe(0);
        expect(await prisma.journalEntryLine.count({ where: { companyId } })).toBe(0);

        const invoice = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(invoice!.getStatus()).toBe(InvoiceStatus.DRAFT);
    });

    it('should let only one of two concurrent requests issue the invoice', async () => {
        const results = await Promise.allSettled([
            issue('journal-1'),
            issue('journal-2'),
        ]);

        const fulfilled = results.filter((result) => result.status === 'fulfilled');
        const rejected = results.filter(
            (result): result is PromiseRejectedResult => result.status === 'rejected',
        );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect(rejected[0].reason).toBeInstanceOf(InvoiceAlreadyIssuedError);

        // The loser's journal entry was rolled back with its transaction.
        const entries = await prisma.journalEntry.findMany({
            where: { companyId },
            include: { lines: true },
        });

        expect(entries).toHaveLength(1);
        expect(entries[0].lines).toHaveLength(2);

        const invoice = await invoiceRepository.findById(companyId, 'invoice-1');
        expect(invoice!.getStatus()).toBe(InvoiceStatus.ISSUED);
        expect(invoice!.getJournalEntryId()).toBe(entries[0].id);
    });
});
