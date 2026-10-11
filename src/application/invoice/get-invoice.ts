import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';

export class GetInvoice {
    constructor(
        private readonly repository: InvoiceRepository,
    ) { }

    async execute(
        companyId: string,
        invoiceId: string,
    ): Promise<Invoice | null> {
        return this.repository.findById(companyId, invoiceId);
    }
}
