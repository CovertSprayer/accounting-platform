import {
    Body,
    Controller,
    Post,
} from '@nestjs/common';

import { CreateCompany } from './create-company';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Controller('companies')
export class CompanyController {
    constructor(
        private readonly createCompany: CreateCompany,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateCompanyDto,
    ): Promise<CompanyResponseDto> {
        const company = await this.createCompany.execute(
            dto.id,
            dto.name,
        );

        return CompanyResponseDto.fromDomain(company);
    }
}