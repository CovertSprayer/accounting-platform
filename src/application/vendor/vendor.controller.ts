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

import { CreateVendor } from './create-vendor';
import { GetVendor } from './get-vendor';
import { ListVendors } from './list-vendors';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { VendorEmailAlreadyExistsError } from '../../domain/vendor/vendor-email-already-exists.error';

@Controller('vendors')
export class VendorController {
    constructor(
        private readonly createVendor: CreateVendor,
        private readonly getVendor: GetVendor,
        private readonly listVendors: ListVendors,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateVendorDto,
    ): Promise<VendorResponseDto> {
        try {
            const vendor = await this.createVendor.execute(
                dto.companyId,
                dto.id,
                dto.name,
                dto.email,
                dto.phone,
            );

            return VendorResponseDto.fromDomain(vendor);
        } catch (error) {
            if (error instanceof VendorEmailAlreadyExistsError) {
                throw new ConflictException(error.message);
            }

            throw error;
        }
    }

    @Get()
    async list(
        @Query('companyId') companyId: string,
    ): Promise<VendorResponseDto[]> {
        const vendors = await this.listVendors.execute(companyId);

        return vendors.map(VendorResponseDto.fromDomain);
    }

    @Get(':id')
    async get(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<VendorResponseDto> {
        const vendor = await this.getVendor.execute(
            companyId,
            id,
        );

        if (!vendor) {
            throw new NotFoundException(
                `Vendor not found: ${id}`,
            );
        }

        return VendorResponseDto.fromDomain(vendor);
    }
}
