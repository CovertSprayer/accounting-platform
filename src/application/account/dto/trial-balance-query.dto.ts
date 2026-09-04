import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class TrialBalanceQueryDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsDateString()
    asOfDate: string;
}
