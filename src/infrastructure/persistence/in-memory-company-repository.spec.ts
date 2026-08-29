import { Company } from '../../domain/company/company';
import { InMemoryCompanyRepository } from './in-memory-company-repository';

describe('InMemoryCompanyRepository', () => {
    it('should save and retrieve a company', async () => {
        const repository =
            new InMemoryCompanyRepository();

        const company = Company.create(
            'company-1',
            'Acme Inc.',
        );

        await repository.save(company);

        const result =
            await repository.findById('company-1');

        expect(result).not.toBeNull();
        expect(result?.getId()).toBe('company-1');
        expect(result?.getName()).toBe('Acme Inc.');
    });

    it('should return null when company does not exist', async () => {
        const repository =
            new InMemoryCompanyRepository();

        const result =
            await repository.findById('does-not-exist');

        expect(result).toBeNull();
    });

    it('should update an existing company', async () => {
        const repository =
            new InMemoryCompanyRepository();

        const company = Company.create(
            'company-1',
            'Acme Inc.',
        );

        await repository.save(company);

        company.rename('Acme Corporation');

        await repository.save(company);

        const result =
            await repository.findById('company-1');

        expect(result?.getName()).toBe(
            'Acme Corporation',
        );
    });
});