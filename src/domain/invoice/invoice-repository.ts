import { Invoice } from './invoice';

export interface InvoiceRepository {
    // Inserts a new invoice, or records the DRAFT → ISSUED transition of an existing one.
    // Throws InvoiceNumberAlreadyExistsError for a duplicate number and
    // InvoiceAlreadyIssuedError if the stored invoice is no longer a draft.
    save(companyId: string, invoice: Invoice): Promise<void>;
    findById(companyId: string, id: string): Promise<Invoice | null>;
    findAll(companyId: string): Promise<Invoice[]>;
    findByNumber(companyId: string, number: string): Promise<Invoice | null>;
}
