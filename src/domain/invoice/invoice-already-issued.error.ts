// Thrown both when issue() is called on a non-draft invoice and when a
// concurrent request already issued it (detected by the repository), so the
// client gets the same response in either case.
export class InvoiceAlreadyIssuedError extends Error {
    constructor(companyId: string, invoiceId: string) {
        super(`Invoice is already issued in company ${companyId}: ${invoiceId}`);
        this.name = 'InvoiceAlreadyIssuedError';
    }
}
