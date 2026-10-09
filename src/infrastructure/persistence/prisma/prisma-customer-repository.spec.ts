import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { PrismaCustomerRepository } from "./prisma-customer-repository";
import { Customer } from "../../../domain/customer/customer";
import { CustomerEmailAlreadyExistsError } from "../../../domain/customer/customer-email-already-exists.error";

describe('PrismaCustomerRepository', () => {
    let prisma: PrismaService;
    let repository: PrismaCustomerRepository;

    const companyId = 'test-company-customer-repository';
    const otherCompanyId = 'test-company-customer-repository-other';
    const companyIds = [companyId, otherCompanyId];

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        repository = new PrismaCustomerRepository(prisma);

        for (const id of companyIds) {
            await prisma.company.upsert({
                where: { id },
                update: {},
                create: { id, name: 'Test Company' },
            });
        }
    });

    beforeEach(async () => {
        await prisma.customer.deleteMany({
            where: { companyId: { in: companyIds } },
        });
    });

    afterAll(async () => {
        await prisma.customer.deleteMany({
            where: { companyId: { in: companyIds } },
        });

        await prisma.company.deleteMany({
            where: { id: { in: companyIds } },
        });

        await prisma.$disconnect();
    });

    it('should save and retrieve a customer', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd', 'ap@acme.com', '+1 555 0100'),
        );

        const found = await repository.findById(companyId, 'customer-1');

        expect(found).not.toBeNull();
        expect(found?.getCompanyId()).toBe(companyId);
        expect(found?.getName()).toBe('Acme Ltd');
        expect(found?.getEmail()).toBe('ap@acme.com');
        expect(found?.getPhone()).toBe('+1 555 0100');
    });

    it('should persist null email and phone', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd'),
        );

        const found = await repository.findById(companyId, 'customer-1');

        expect(found?.getEmail()).toBeNull();
        expect(found?.getPhone()).toBeNull();
    });

    it('should return null when customer does not exist', async () => {
        expect(await repository.findById(companyId, 'missing')).toBeNull();
    });

    it('should not return a customer from another company', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd'),
        );

        expect(await repository.findById(otherCompanyId, 'customer-1')).toBeNull();
        expect(await repository.findAll(otherCompanyId)).toEqual([]);
    });

    it('should list all customers for a company', async () => {
        await repository.save(companyId, Customer.create('customer-1', companyId, 'Acme Ltd'));
        await repository.save(companyId, Customer.create('customer-2', companyId, 'Globex'));

        const customers = await repository.findAll(companyId);

        expect(customers.map((customer) => customer.getId()))
            .toEqual(expect.arrayContaining(['customer-1', 'customer-2']));
        expect(customers).toHaveLength(2);
    });

    it('should find a customer by email within the company only', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd', 'ap@acme.com'),
        );

        expect((await repository.findByEmail(companyId, 'ap@acme.com'))?.getId()).toBe('customer-1');
        expect(await repository.findByEmail(otherCompanyId, 'ap@acme.com')).toBeNull();
    });

    it('should reject a duplicate email in the same company via the database constraint', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd', 'ap@acme.com'),
        );

        await expect(
            repository.save(
                companyId,
                Customer.create('customer-2', companyId, 'Acme Again', 'ap@acme.com'),
            ),
        ).rejects.toThrow(CustomerEmailAlreadyExistsError);

        expect(await repository.findById(companyId, 'customer-2')).toBeNull();
    });

    it('should allow the same email in different companies', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd', 'ap@acme.com'),
        );
        await repository.save(
            otherCompanyId,
            Customer.create('customer-1', otherCompanyId, 'Acme Ltd', 'ap@acme.com'),
        );

        expect(await repository.findById(companyId, 'customer-1')).not.toBeNull();
        expect(await repository.findById(otherCompanyId, 'customer-1')).not.toBeNull();
    });

    it('should allow multiple customers without an email in the same company', async () => {
        await repository.save(companyId, Customer.create('customer-1', companyId, 'Acme Ltd'));
        await repository.save(companyId, Customer.create('customer-2', companyId, 'Globex'));

        expect(await repository.findAll(companyId)).toHaveLength(2);
    });

    it('should not report a duplicate id as a duplicate email', async () => {
        await repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Acme Ltd', 'ap@acme.com'),
        );

        const saveDuplicateId = repository.save(
            companyId,
            Customer.create('customer-1', companyId, 'Globex', 'billing@globex.com'),
        );

        await expect(saveDuplicateId).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        await expect(saveDuplicateId).rejects.toMatchObject({ code: 'P2002' });
        await expect(saveDuplicateId).rejects.not.toBeInstanceOf(CustomerEmailAlreadyExistsError);
    });

    it('should reject a customer for a company that does not exist', async () => {
        await expect(
            repository.save(
                'missing-company',
                Customer.create('customer-1', 'missing-company', 'Acme Ltd'),
            ),
        ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('should prevent deleting a company that still has customers', async () => {
        await repository.save(companyId, Customer.create('customer-1', companyId, 'Acme Ltd'));

        await expect(
            prisma.company.delete({ where: { id: companyId } }),
        ).rejects.toMatchObject({ code: 'P2003' });

        expect(await prisma.company.findUnique({ where: { id: companyId } })).not.toBeNull();
    });
});
