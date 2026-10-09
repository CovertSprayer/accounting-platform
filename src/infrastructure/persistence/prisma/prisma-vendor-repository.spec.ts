import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { PrismaVendorRepository } from "./prisma-vendor-repository";
import { Vendor } from "../../../domain/vendor/vendor";
import { VendorEmailAlreadyExistsError } from "../../../domain/vendor/vendor-email-already-exists.error";

describe('PrismaVendorRepository', () => {
    let prisma: PrismaService;
    let repository: PrismaVendorRepository;

    const companyId = 'test-company-vendor-repository';
    const otherCompanyId = 'test-company-vendor-repository-other';
    const companyIds = [companyId, otherCompanyId];

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        repository = new PrismaVendorRepository(prisma);

        for (const id of companyIds) {
            await prisma.company.upsert({
                where: { id },
                update: {},
                create: { id, name: 'Test Company' },
            });
        }
    });

    beforeEach(async () => {
        await prisma.vendor.deleteMany({
            where: { companyId: { in: companyIds } },
        });
    });

    afterAll(async () => {
        await prisma.vendor.deleteMany({
            where: { companyId: { in: companyIds } },
        });

        await prisma.company.deleteMany({
            where: { id: { in: companyIds } },
        });

        await prisma.$disconnect();
    });

    it('should save and retrieve a vendor', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co', 'billing@supplies.com', '+1 555 0100'),
        );

        const found = await repository.findById(companyId, 'vendor-1');

        expect(found).not.toBeNull();
        expect(found?.getCompanyId()).toBe(companyId);
        expect(found?.getName()).toBe('Office Supplies Co');
        expect(found?.getEmail()).toBe('billing@supplies.com');
        expect(found?.getPhone()).toBe('+1 555 0100');
    });

    it('should persist null email and phone', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co'),
        );

        const found = await repository.findById(companyId, 'vendor-1');

        expect(found?.getEmail()).toBeNull();
        expect(found?.getPhone()).toBeNull();
    });

    it('should return null when vendor does not exist', async () => {
        expect(await repository.findById(companyId, 'missing')).toBeNull();
    });

    it('should not return a vendor from another company', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co'),
        );

        expect(await repository.findById(otherCompanyId, 'vendor-1')).toBeNull();
        expect(await repository.findAll(otherCompanyId)).toEqual([]);
    });

    it('should list all vendors for a company', async () => {
        await repository.save(companyId, Vendor.create('vendor-1', companyId, 'Office Supplies Co'));
        await repository.save(companyId, Vendor.create('vendor-2', companyId, 'Globex'));

        const vendors = await repository.findAll(companyId);

        expect(vendors.map((vendor) => vendor.getId()))
            .toEqual(expect.arrayContaining(['vendor-1', 'vendor-2']));
        expect(vendors).toHaveLength(2);
    });

    it('should find a vendor by email within the company only', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co', 'billing@supplies.com'),
        );

        expect((await repository.findByEmail(companyId, 'billing@supplies.com'))?.getId()).toBe('vendor-1');
        expect(await repository.findByEmail(otherCompanyId, 'billing@supplies.com')).toBeNull();
    });

    it('should reject a duplicate email in the same company via the database constraint', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co', 'billing@supplies.com'),
        );

        await expect(
            repository.save(
                companyId,
                Vendor.create('vendor-2', companyId, 'Office Supplies Again', 'billing@supplies.com'),
            ),
        ).rejects.toThrow(VendorEmailAlreadyExistsError);

        expect(await repository.findById(companyId, 'vendor-2')).toBeNull();
    });

    it('should allow the same email in different companies', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co', 'billing@supplies.com'),
        );
        await repository.save(
            otherCompanyId,
            Vendor.create('vendor-1', otherCompanyId, 'Office Supplies Co', 'billing@supplies.com'),
        );

        expect(await repository.findById(companyId, 'vendor-1')).not.toBeNull();
        expect(await repository.findById(otherCompanyId, 'vendor-1')).not.toBeNull();
    });

    it('should allow multiple vendors without an email in the same company', async () => {
        await repository.save(companyId, Vendor.create('vendor-1', companyId, 'Office Supplies Co'));
        await repository.save(companyId, Vendor.create('vendor-2', companyId, 'Globex'));

        expect(await repository.findAll(companyId)).toHaveLength(2);
    });

    it('should not report a duplicate id as a duplicate email', async () => {
        await repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Office Supplies Co', 'billing@supplies.com'),
        );

        const saveDuplicateId = repository.save(
            companyId,
            Vendor.create('vendor-1', companyId, 'Globex', 'billing@globex.com'),
        );

        await expect(saveDuplicateId).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        await expect(saveDuplicateId).rejects.toMatchObject({ code: 'P2002' });
        await expect(saveDuplicateId).rejects.not.toBeInstanceOf(VendorEmailAlreadyExistsError);
    });

    it('should reject a vendor for a company that does not exist', async () => {
        await expect(
            repository.save(
                'missing-company',
                Vendor.create('vendor-1', 'missing-company', 'Office Supplies Co'),
            ),
        ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('should prevent deleting a company that still has vendors', async () => {
        await repository.save(companyId, Vendor.create('vendor-1', companyId, 'Office Supplies Co'));

        await expect(
            prisma.company.delete({ where: { id: companyId } }),
        ).rejects.toMatchObject({ code: 'P2003' });

        expect(await prisma.company.findUnique({ where: { id: companyId } })).not.toBeNull();
    });
});
