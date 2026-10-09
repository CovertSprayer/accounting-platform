import {
    Body,
    ConflictException,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
} from '@nestjs/common';

import { CreateCustomer } from './create-customer';
import { GetCustomer } from './get-customer';
import { ListCustomers } from './list-customers';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerEmailAlreadyExistsError } from '../../domain/customer/customer-email-already-exists.error';

@Controller('customers')
export class CustomerController {
    constructor(
        private readonly createCustomer: CreateCustomer,
        private readonly getCustomer: GetCustomer,
        private readonly listCustomers: ListCustomers,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateCustomerDto,
    ): Promise<CustomerResponseDto> {
        try {
            const customer = await this.createCustomer.execute(
                dto.companyId,
                dto.id,
                dto.name,
                dto.email,
                dto.phone,
            );

            return CustomerResponseDto.fromDomain(customer);
        } catch (error) {
            if (error instanceof CustomerEmailAlreadyExistsError) {
                throw new ConflictException(error.message);
            }

            throw error;
        }
    }

    @Get()
    async list(
        @Query('companyId') companyId: string,
    ): Promise<CustomerResponseDto[]> {
        const customers = await this.listCustomers.execute(companyId);

        return customers.map(CustomerResponseDto.fromDomain);
    }

    @Get(':id')
    async get(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<CustomerResponseDto> {
        const customer = await this.getCustomer.execute(
            companyId,
            id,
        );

        if (!customer) {
            throw new NotFoundException(
                `Customer not found: ${id}`,
            );
        }

        return CustomerResponseDto.fromDomain(customer);
    }
}
