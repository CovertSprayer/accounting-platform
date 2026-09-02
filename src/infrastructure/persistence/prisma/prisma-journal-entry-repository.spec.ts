import { Test, TestingModule } from '@nestjs/testing';

import { PrismaJournalEntryRepository } from './prisma-journal-entry-repository';
import { PrismaService } from '../../database/prisma.service';

import { JournalEntry } from '../../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../../domain/journal/journal-entry-line';
import { JournalEntryStatus } from '../../../domain/journal/journal-entry-status';
import { Account } from '../../../domain/account/account';
import { AccountType } from '../../../domain/account/account-type';
import { Money } from '../../../domain/shared/money';

describe('PrismaJournalEntryRepository', () => {
    let repository: PrismaJournalEntryRepository;
    let prisma: PrismaService;

    const companyId = 'test-company-journal';

    const bank = Account.create(
        'test-bank',
        companyId,
        'Bank',
        AccountType.ASSET,
    );

    const revenue = Account.create(
        'test-revenue',
        companyId,
        'Sales Revenue',
        AccountType.REVENUE,
    );

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrismaJournalEntryRepository,
                PrismaService,
            ],
        }).compile();

        repository = module.get(PrismaJournalEntryRepository);
        prisma = module.get(PrismaService);

        await prisma.journalEntry.deleteMany({
            where: {
                companyId,
            },
        });

        await prisma.account.deleteMany({
            where: {
                companyId,
            },
        });

        await prisma.company.create({
            data: {
                id: companyId,
                name: 'Test Journal Company',
            },
        });

        await prisma.account.createMany({
            data: [
                {
                    id: bank.getId(),
                    companyId,
                    name: bank.getName(),
                    type: 'ASSET',
                },
                {
                    id: revenue.getId(),
                    companyId,
                    name: revenue.getName(),
                    type: 'REVENUE',
                },
            ],
        });
    });

    afterAll(async () => {
        await prisma.journalEntryLine.deleteMany({
            where: {
                companyId,
            },
        });

        await prisma.journalEntry.deleteMany({
            where: {
                companyId,
            },
        });

        await prisma.account.deleteMany({
            where: {
                companyId,
            },
        });

        await prisma.company.delete({
            where: {
                id: companyId,
            },
        });

        await prisma.$disconnect();
    });

    it('should save and retrieve a journal entry', async () => {
        const entry = JournalEntry.create(
            'test-entry-1',
            [
                JournalEntryLine.debit(
                    bank,
                    Money.create('10000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('10000'),
                ),
            ],
        );

        await repository.save(companyId, entry);

        const savedEntry = await repository.findById(
            companyId,
            'test-entry-1',
        );

        expect(savedEntry).not.toBeNull();
        expect(savedEntry!.getId()).toBe('test-entry-1');
        expect(savedEntry!.getStatus()).toBe(
            JournalEntryStatus.DRAFT,
        );
        expect(savedEntry!.getLines()).toHaveLength(2);
    });

    it('should update an existing journal entry', async () => {
        const entry = JournalEntry.create(
            'test-entry-2',
            [
                JournalEntryLine.debit(
                    bank,
                    Money.create('5000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('5000'),
                ),
            ],
        );

        await repository.save(companyId, entry);

        const savedEntry = await repository.findById(
            companyId,
            'test-entry-2',
        );

        expect(savedEntry).not.toBeNull();
        expect(savedEntry!.getStatus()).toBe(
            JournalEntryStatus.DRAFT,
        );

        savedEntry!.post();

        await repository.save(
            companyId,
            savedEntry!,
        );

        const postedEntry = await repository.findById(
            companyId,
            'test-entry-2',
        );

        expect(postedEntry).not.toBeNull();
        expect(postedEntry!.getStatus()).toBe(
            JournalEntryStatus.POSTED,
        );

        expect(postedEntry!.getLines()).toHaveLength(2);
    });
});