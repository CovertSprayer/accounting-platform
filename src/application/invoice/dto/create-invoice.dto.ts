import {
    ArrayMinSize,
    IsArray,
    IsDate,
    IsNotEmpty,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Unsigned decimal string: up to 16 integer digits and 4 decimal places,
// matching Decimal(20,4). JSON numbers are rejected by @IsString(): they are
// already binary floats by the time JSON.parse hands them to us.
const DECIMAL_STRING = /^\d{1,16}(\.\d{1,4})?$/;

class CreateInvoiceLineDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @Matches(DECIMAL_STRING, {
        message: 'quantity must be a decimal string with at most 16 integer digits and 4 decimal places',
    })
    quantity: string;

    @IsString()
    @Matches(DECIMAL_STRING, {
        message: 'unitPrice must be a decimal string with at most 16 integer digits and 4 decimal places',
    })
    unitPrice: string;

    @IsString()
    @IsNotEmpty()
    revenueAccountId: string;
}

export class CreateInvoiceDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    customerId: string;

    @IsString()
    @IsNotEmpty()
    number: string;

    @Type(() => Date)
    @IsDate()
    issueDate: Date;

    @Type(() => Date)
    @IsDate()
    dueDate: Date;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceLineDto)
    lines: CreateInvoiceLineDto[];
}
