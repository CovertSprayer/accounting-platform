import Decimal from 'decimal.js';
import { Invoice } from '../../domain/invoice/invoice';
import { InvoiceLine } from '../../domain/invoice/invoice-line';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';
import { InvoiceNumberAlreadyExistsError } from '../../domain/invoice/invoice-number-already-exists.error';
import { CustomerRepository } from '../../domain/customer/customer-repository';
import { AccountRepository } from '../../domain/account/account-repository';
import { Money } from '../../domain/shared/money';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';

// quantity and unitPrice are decimal strings ("2.5", "19.9900"), never JS numbers,
// so no precision is lost before they reach Decimal/Money.
export interface CreateInvoiceInput {
    id: string;
    customerId: string;
    number: string;
    issueDate: Date;
    dueDate: Date;
    lines: {
        description: string;
        quantity: string;
        unitPrice: string;
        revenueAccountId: string;
    }[];
}

export class CreateInvoice {
    constructor(
        private readonly repository: InvoiceRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly accountRepository: AccountRepository,
    ) { }

    async execute(companyId: string, input: CreateInvoiceInput): Promise<Invoice> {
        const customer = await this.customerRepository.findById(companyId, input.customerId);

        if (!customer) {
            throw new DomainValidationError(`Customer not found: ${input.customerId}`);
        }

        const lines = await Promise.all(
            input.lines.map(async line => {
                const account = await this.accountRepository.findById(
                    companyId,
                    line.revenueAccountId,
                );

                if (!account) {
                    throw new DomainValidationError(`Account not found: ${line.revenueAccountId}`);
                }

                return InvoiceLine.create(
                    line.description,
                    this.parseDecimal(line.quantity, 'quantity'),
                    Money.create(this.parseDecimal(line.unitPrice, 'unit price')),
                    account,
                );
            }),
        );

        const invoice = Invoice.create({
            id: input.id,
            companyId,
            customerId: customer.getId(),
            number: input.number,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            lines,
        });

        const existing = await this.repository.findByNumber(companyId, invoice.getNumber());

        if (existing) {
            throw new InvoiceNumberAlreadyExistsError(companyId, invoice.getNumber());
        }

        await this.repository.save(companyId, invoice);
        return invoice;
    }

    // decimal.js throws its own error for text like "abc"; report it as a business error.
    private parseDecimal(value: string, field: string): Decimal {
        try {
            return new Decimal(value);
        } catch {
            throw new DomainValidationError(`Invoice line ${field} must be a valid number`);
        }
    }
}
