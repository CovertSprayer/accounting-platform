import { PrismaService } from '../../database/prisma.service';
import { PrismaCompanyRepository } from './prisma-company-repository';
import { Company } from '../../../domain/company/company';

describe('PrismaCompanyRepository', () => {
    const prisma = new PrismaService();
    const repository =
        new PrismaCompanyRepository(prisma);

    const companyId = 'test-company-1';

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.company.deleteMany({
            where: {
                id: companyId,
            },
        });

        await prisma.$disconnect();
    });

    it('should save and retrieve a company', async () => {
        // const company = {
        //     getId: () => companyId,
        //     getName: () => 'Acme Inc.',
        // };
        // await repository.save(company as any);
        
        const company = Company.create(companyId, 'Acme Inc.');

        await repository.save(company as any);

        const result =
            await repository.findById(companyId);

        expect(result).not.toBeNull();
        expect(result?.getId()).toBe(companyId);
        expect(result?.getName()).toBe('Acme Inc.');
    });

    it('should return null when company does not exist', async () => {
        const result =
            await repository.findById(
                'does-not-exist',
            );

        expect(result).toBeNull();
    });
});