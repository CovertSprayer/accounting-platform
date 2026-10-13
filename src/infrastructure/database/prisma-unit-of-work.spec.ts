import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction-context';
import { PrismaUnitOfWork } from './prisma-unit-of-work';
import { PrismaJournalEntryRepository } from '../persistence/prisma/prisma-journal-entry-repository';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { Money } from '../../domain/shared/money';

class ExpectedFailure extends Error { }

describe('PrismaUnitOfWork', () => {
    let prisma: PrismaService;
    let context: PrismaTransactionContext;
    let unitOfWork: PrismaUnitOfWork;
    let repository: PrismaJournalEntryRepository;

    const companyId = 'test-company-unit-of-work';

    const bank = Account.create('bank', companyId, 'Bank', AccountType.ASSET);
    const revenue = Account.create('revenue', companyId, 'Revenue', AccountType.REVENUE);

    const createEntry = (id: string) =>
        JournalEntry.create(id, companyId, new Date('2026-10-01'), [
            JournalEntryLine.debit(bank, Money.create('100')),
            JournalEntryLine.credit(revenue, Money.create('100')),
        ]);

    // Reads through the root client, outside any transaction.
    const committedEntry = (id: string) =>
        prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } });

    const cleanUp = async () => {
        await prisma.journalEntryLine.deleteMany({ where: { companyId } });
        await prisma.journalEntry.deleteMany({ where: { companyId } });
    };

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        context = new PrismaTransactionContext();
        unitOfWork = new PrismaUnitOfWork(prisma, context);
        repository = new PrismaJournalEntryRepository(prisma, context);

        await cleanUp();
        await prisma.account.deleteMany({ where: { companyId } });
        await prisma.company.upsert({
            where: { id: companyId },
            update: {},
            create: { id: companyId, name: 'Test Unit Of Work Company' },
        });
        await prisma.account.createMany({
            data: [
                { id: 'bank', companyId, name: 'Bank', type: 'ASSET' },
                { id: 'revenue', companyId, name: 'Revenue', type: 'REVENUE' },
            ],
        });
    });

    beforeEach(async () => {
        await cleanUp();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await cleanUp();
        await prisma.account.deleteMany({ where: { companyId } });
        await prisma.company.deleteMany({ where: { id: companyId } });
        await prisma.$disconnect();
    });

    it('should return the result of the work', async () => {
        await expect(unitOfWork.run(async () => 42)).resolves.toBe(42);
    });

    it('should reuse the active transaction inside a unit of work', async () => {
        await unitOfWork.run(async () => {
            await repository.save(companyId, createEntry('uow-entry-1'));

            // Same transaction: the repository sees its own uncommitted write.
            expect(await repository.findById(companyId, 'uow-entry-1')).not.toBeNull();

            // Outside the transaction: not committed yet, so not visible.
            expect(await committedEntry('uow-entry-1')).toBeNull();
        });

        const row = await committedEntry('uow-entry-1');
        expect(row).not.toBeNull();
        expect(row!.lines).toHaveLength(2);
    });

    it('should open exactly one transaction for several saves', async () => {
        const spy = jest.spyOn(prisma, '$transaction');

        await unitOfWork.run(async () => {
            await repository.save(companyId, createEntry('uow-entry-1'));
            await repository.save(companyId, createEntry('uow-entry-2'));
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should open one transaction per save outside a unit of work', async () => {
        const spy = jest.spyOn(prisma, '$transaction');

        await repository.save(companyId, createEntry('uow-entry-1'));
        await repository.save(companyId, createEntry('uow-entry-2'));

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should join the outer unit of work when run is nested', async () => {
        const spy = jest.spyOn(prisma, '$transaction');

        await unitOfWork.run(() =>
            unitOfWork.run(() => repository.save(companyId, createEntry('uow-entry-1'))),
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(await committedEntry('uow-entry-1')).not.toBeNull();
    });

    it('should roll back every write when the work fails', async () => {
        const failure = new ExpectedFailure('fail after saving');

        await expect(
            unitOfWork.run(async () => {
                await repository.save(companyId, createEntry('uow-entry-1'));
                await repository.save(companyId, createEntry('uow-entry-2'));
                throw failure;
            }),
        ).rejects.toBe(failure); // same error instance, not wrapped

        expect(await committedEntry('uow-entry-1')).toBeNull();
        expect(await committedEntry('uow-entry-2')).toBeNull();
        expect(await prisma.journalEntryLine.count({ where: { companyId } })).toBe(0);
    });

    it('should not leak the transaction after a failed unit of work', async () => {
        await expect(
            unitOfWork.run(async () => {
                throw new ExpectedFailure('fail');
            }),
        ).rejects.toThrow(ExpectedFailure);

        expect(context.current()).toBeUndefined();

        await repository.save(companyId, createEntry('uow-entry-1'));
        expect(await committedEntry('uow-entry-1')).not.toBeNull();
    });

    it('should keep concurrent units of work isolated', async () => {
        const failure = new ExpectedFailure('second fails');

        const results = await Promise.allSettled([
            unitOfWork.run(() => repository.save(companyId, createEntry('uow-entry-1'))),
            unitOfWork.run(async () => {
                await repository.save(companyId, createEntry('uow-entry-2'));
                throw failure;
            }),
        ]);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(await committedEntry('uow-entry-1')).not.toBeNull();
        expect(await committedEntry('uow-entry-2')).toBeNull();
    });
});
