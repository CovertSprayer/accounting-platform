export class CustomerEmailAlreadyExistsError extends Error {
    constructor(companyId: string, email: string) {
        super(`Customer email already exists in company ${companyId}: ${email}`);
        this.name = 'CustomerEmailAlreadyExistsError';
    }
}
