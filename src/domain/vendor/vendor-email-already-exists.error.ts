export class VendorEmailAlreadyExistsError extends Error {
    constructor(companyId: string, email: string) {
        super(`Vendor email already exists in company ${companyId}: ${email}`);
        this.name = 'VendorEmailAlreadyExistsError';
    }
}
