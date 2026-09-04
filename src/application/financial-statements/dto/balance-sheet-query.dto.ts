import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class BalanceSheetQueryDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsDateString()
    asOfDate: string;
}
