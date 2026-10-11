import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';

export class ListInvoices {
    constructor(
        private readonly repository: InvoiceRepository,
    ) { }

    async execute(companyId: string): Promise<Invoice[]> {
        return this.repository.findAll(companyId);
    }
}
