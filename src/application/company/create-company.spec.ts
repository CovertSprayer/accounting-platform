import { CreateCompany } from './create-company';
import { CompanyRepository } from '../../domain/company/company-repository';
import { Company } from '../../domain/company/company';

describe('CreateCompany', () => {
    it('should create and save a company', async () => {
        const savedCompanies: Company[] = [];

        const repository: CompanyRepository = {
            save: async (company) => {
                savedCompanies.push(company);
            },

            findById: async () => null,
        };

        const useCase = new CreateCompany(repository);

        await useCase.execute(
            'company-1',
            'Acme Inc.',
        );

        expect(savedCompanies).toHaveLength(1);
        expect(savedCompanies[0].getId()).toBe(
            'company-1',
        );
        expect(savedCompanies[0].getName()).toBe(
            'Acme Inc.',
        );
    });

    it('should reject an empty company name', async () => {
        const repository: CompanyRepository = {
            save: async () => {
                throw new Error('Should not be called');
            },

            findById: async () => null,
        };

        const useCase = new CreateCompany(repository);

        await expect(
            useCase.execute('company-1', ''),
        ).rejects.toThrow(
            'Company name cannot be empty',
        );
    });
});