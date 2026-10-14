import { Module } from '@nestjs/common';

import { CreateInvoice } from './create-invoice';
import { GetInvoice } from './get-invoice';
import { ListInvoices } from './list-invoices';
import { IssueInvoice } from './issue-invoice';
import { InvoiceController } from './invoice.controller';
import { INVOICE_REPOSITORY } from './invoice-repository.token';
import { InvoiceRepository } from '../../domain/invoice/invoice-repository';
import { CustomerRepository } from '../../domain/customer/customer-repository';
import { AccountRepository } from '../../domain/account/account-repository';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { UnitOfWork } from '../shared/unit-of-work';
import { UNIT_OF_WORK } from '../shared/unit-of-work.token';
import { CustomerModule } from '../customer/customer.module';
import { AccountModule } from '../account/account.module';
import { JournalModule } from '../journal/journal.module';
import { CUSTOMER_REPOSITORY } from '../customer/customer-repository.token';
import { ACCOUNT_REPOSITORY } from '../account/account-repository.token';
import { JOURNAL_ENTRY_REPOSITORY } from '../journal/journal-entry-repository.token';

import { PrismaInvoiceRepository } from '../../infrastructure/persistence/prisma/prisma-invoice-repository';

@Module({
    imports: [
        CustomerModule,
        AccountModule,
        JournalModule,
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

        {
            provide: IssueInvoice,
            useFactory: (
                repository: InvoiceRepository,
                journalEntryRepository: JournalEntryRepository,
                accountRepository: AccountRepository,
                unitOfWork: UnitOfWork,
            ) => {
                return new IssueInvoice(
                    repository,
                    journalEntryRepository,
                    accountRepository,
                    unitOfWork,
                );
            },
            inject: [
                INVOICE_REPOSITORY,
                JOURNAL_ENTRY_REPOSITORY,
                ACCOUNT_REPOSITORY,
                UNIT_OF_WORK,
            ],
        },
    ],
})
export class InvoiceModule { }
