import { Company } from './company';

describe('Company', () => {
    it('should create a company', () => {
        const company = Company.create(
            'company-1',
            'Acme Inc.',
        );

        expect(company.getId()).toBe('company-1');
        expect(company.getName()).toBe('Acme Inc.');
    });

    it('should trim the company name', () => {
        const company = Company.create(
            'company-1',
            '  Acme Inc.  ',
        );

        expect(company.getName()).toBe('Acme Inc.');
    });

    it('should reject an empty company name', () => {
        expect(() =>
            Company.create('company-1', ''),
        ).toThrow('Company name cannot be empty');
    });

    it('should reject a whitespace-only company name', () => {
        expect(() =>
            Company.create('company-1', '   '),
        ).toThrow('Company name cannot be empty');
    });

    it('should rename a company', () => {
        const company = Company.create(
            'company-1',
            'Acme Inc.',
        );

        company.rename('Acme Corporation');

        expect(company.getName()).toBe(
            'Acme Corporation',
        );
    });

    it('should reject an empty name when renaming', () => {
        const company = Company.create(
            'company-1',
            'Acme Inc.',
        );

        expect(() => company.rename('')).toThrow(
            'Company name cannot be empty',
        );
    });
});