import { PrismaService } from "../../../../src/infrastructure/database/prisma.service";
import { PrismaAccountRepository } from "./prisma-account-repository";
import { Account } from "../../../../src/domain/account/account";
import { AccountType } from "../../../../src/domain/account/account-type";


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

    })
})