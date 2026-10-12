import { Module } from '@nestjs/common';

import { CreateInvoice } from './create-invoice';
import { GetInvoice } from './get-invoice';
import { ListInvoices } from './list-invoices';
import { InvoiceController } from './invoice.controller';
import { INVOICE_REPOSITORY } from './invoice-repository.token';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';
import { CustomerRepository } from '../../domain/customer/customer-repository';
import { AccountRepository } from '../../domain/account/account-repository';
import { CustomerModule } from '../customer/customer.module';
import { AccountModule } from '../account/account.module';
import { CUSTOMER_REPOSITORY } from '../customer/customer-repository.token';
import { ACCOUNT_REPOSITORY } from '../account/account-repository.token';

import { PrismaInvoiceRepository } from '../../infrastructure/persistence/prisma/prisma-invoice-repository';

@Module({
    imports: [
        CustomerModule,
        AccountModule,
    ],
    controllers: [InvoiceController],
    providers: [
        {
            provide: INVOICE_REPOSITORY,
            useClass: PrismaInvoiceRepository,
        },

        {
            provide: CreateInvoice,
            useFactory: (
                repository: InvoiceRepository,
                customerRepository: CustomerRepository,
                accountRepository: AccountRepository,
            ) => {
                return new CreateInvoice(repository, customerRepository, accountRepository);
            },
            inject: [
                INVOICE_REPOSITORY,
                CUSTOMER_REPOSITORY,
                ACCOUNT_REPOSITORY,
            ],
        },

        {
            provide: GetInvoice,
            useFactory: (repository: InvoiceRepository) => {
                return new GetInvoice(repository);
            },
            inject: [INVOICE_REPOSITORY],
        },

        {
            provide: ListInvoices,
            useFactory: (repository: InvoiceRepository) => {
                return new ListInvoices(repository);
            },
            inject: [INVOICE_REPOSITORY],
        },
    ],
})
export class InvoiceModule { }
