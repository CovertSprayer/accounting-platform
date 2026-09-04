import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class ProfitAndLossQueryDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsDateString()
    fromDate: string;

    @IsDateString()
    toDate: string;
}
