export class InvoiceNumberAlreadyExistsError extends Error {
    constructor(companyId: string, number: string) {
        super(`Invoice number already exists in company ${companyId}: ${number}`);
        this.name = 'InvoiceNumberAlreadyExistsError';
    }
}
