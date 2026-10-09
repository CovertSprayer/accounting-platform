import { Module } from '@nestjs/common';

import { CreateCustomer } from './create-customer';
import { GetCustomer } from './get-customer';
import { ListCustomers } from './list-customers';
import { CustomerController } from './customer.controller';
import { CUSTOMER_REPOSITORY } from './customer-repository.token';
import { CustomerRepository } from '../../domain/customer/customer-repository';

import { PrismaCustomerRepository } from '../../infrastructure/persistence/prisma/prisma-customer-repository';

@Module({
    controllers: [CustomerController],
    providers: [
        {
            provide: CUSTOMER_REPOSITORY,
            useClass: PrismaCustomerRepository,
        },

        {
            provide: CreateCustomer,
            useFactory: (repository: CustomerRepository) => {
                return new CreateCustomer(repository);
            },
            inject: [CUSTOMER_REPOSITORY],
        },

        {
            provide: GetCustomer,
            useFactory: (repository: CustomerRepository) => {
                return new GetCustomer(repository);
            },
            inject: [CUSTOMER_REPOSITORY],
        },

        {
            provide: ListCustomers,
            useFactory: (repository: CustomerRepository) => {
                return new ListCustomers(repository);
            },
            inject: [CUSTOMER_REPOSITORY],
        },
    ],
    exports: [
        CUSTOMER_REPOSITORY,
    ],
})
export class CustomerModule { }
