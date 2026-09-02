import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { PrismaAccountRepository } from "./prisma-account-repository";
import { Account } from "../../../domain/account/account";
import { AccountType } from "../../../domain/account/account-type";


describe('PrismaAccountRepository', () => {
    let prisma: PrismaService;
    let repository: PrismaAccountRepository;

    const companyId = 'test-company-account-repository';

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        repository = new PrismaAccountRepository(prisma);

        await prisma.company.upsert({
            where: {
                id: companyId,
            },
            update: {},
            create: {
                id: companyId,
                name: 'Test Company',
            },
        });
    });

    beforeEach(async () => {
        await prisma.account.deleteMany({
            where: {
                companyId,
            },
        });
    });

    afterAll(async () => {
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

    it("should save and retrieve an account", async () => {
        const account = Account.create(
            "cash-1",
            companyId,
            "Cash",
            AccountType.ASSET
        );

        await repository.save(companyId, account);

        const result = await repository.findById(companyId, account.getId());

        expect(result).not.toBeNull();

        expect(result?.getId()).toBe(account.getId());

        expect(result?.getCompanyId()).toBe(account.getCompanyId());

        expect(result?.getName()).toBe(account.getName());

        expect(result?.getType()).toBe(
            AccountType.ASSET,
        );

    });

    it('should return all accounts for a company', async () => {
        const cash = Account.create(
            'cash-2',
            companyId,
            'Cash',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue-1',
            companyId,
            'Revenue',
            AccountType.REVENUE,
        );

        await repository.save(companyId, cash);
        await repository.save(companyId, revenue);

        const accounts = await repository.findAll(companyId);

        expect(accounts).toHaveLength(2);
        expect(accounts.map(account => account.getId()))
            .toEqual(
                expect.arrayContaining([
                    'cash-2',
                    'revenue-1',
                ]),
            );
    });

    it('should not return accounts from another company', async () => {
        const otherCompanyId = 'test-company-account-repository-2';

        await prisma.company.upsert({
            where: {
                id: otherCompanyId,
            },
            update: {},
            create: {
                id: otherCompanyId,
                name: 'Other Test Company',
            },
        });

        const company1Account = Account.create(
            'same-account-id',
            companyId,
            'Cash',
            AccountType.ASSET,
        );

        const company2Account = Account.create(
            'same-account-id',
            otherCompanyId,
            'Cash',
            AccountType.ASSET,
        );

        await repository.save(companyId, company1Account);
        await repository.save(otherCompanyId, company2Account);

        const accounts = await repository.findAll(companyId);

        expect(accounts).toHaveLength(1);
        expect(accounts[0].getId()).toBe('same-account-id');
        expect(accounts[0].getCompanyId()).toBe(companyId);

        await prisma.account.deleteMany({
            where: {
                companyId: otherCompanyId,
            },
        });

        await prisma.company.delete({
            where: {
                id: otherCompanyId,
            },
        });
    });
})