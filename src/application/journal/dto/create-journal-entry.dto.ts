import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum JournalLineType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT',
}

class CreateJournalEntryLineDto {
    @IsString()
    @IsNotEmpty()
    accountId: string;

    @IsEnum(JournalLineType)
    type: JournalLineType;

    @IsString()
    @IsNotEmpty()
    amount: string;
}

export class CreateJournalEntryDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    id: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateJournalEntryLineDto)
    lines: CreateJournalEntryLineDto[];
}