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

import { CreateInvoice } from './create-invoice';
import { GetInvoice } from './get-invoice';
import { ListInvoices } from './list-invoices';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceNumberAlreadyExistsError } from '../../domain/invoice/invoice-number-already-exists.error';

@Controller('invoices')
export class InvoiceController {
    constructor(
        private readonly createInvoice: CreateInvoice,
        private readonly getInvoice: GetInvoice,
        private readonly listInvoices: ListInvoices,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateInvoiceDto,
    ): Promise<InvoiceResponseDto> {
        try {
            const invoice = await this.createInvoice.execute(
                dto.companyId,
                {
                    id: dto.id,
                    customerId: dto.customerId,
                    number: dto.number,
                    issueDate: dto.issueDate,
                    dueDate: dto.dueDate,
                    lines: dto.lines.map((line) => ({
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        revenueAccountId: line.revenueAccountId,
                    })),
                },
            );

            return InvoiceResponseDto.fromDomain(invoice);
        } catch (error) {
            if (error instanceof InvoiceNumberAlreadyExistsError) {
                throw new ConflictException(error.message);
            }

            throw error;
        }
    }

    @Get()
    async list(
        @Query('companyId') companyId: string,
    ): Promise<InvoiceResponseDto[]> {
        const invoices = await this.listInvoices.execute(companyId);

        return invoices.map(InvoiceResponseDto.fromDomain);
    }

    @Get(':id')
    async get(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<InvoiceResponseDto> {
        const invoice = await this.getInvoice.execute(
            companyId,
            id,
        );

        if (!invoice) {
            throw new NotFoundException(
                `Invoice not found: ${id}`,
            );
        }

        return InvoiceResponseDto.fromDomain(invoice);
    }
}
