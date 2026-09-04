import { Controller, Get, Query } from '@nestjs/common';
import { GetProfitAndLoss } from './get-profit-and-loss';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';

@Controller('financial-statements')
export class FinancialStatementsController {
    constructor(
        private readonly getProfitAndLossUseCase: GetProfitAndLoss,
    ) { }

    @Get('profit-and-loss')
    async getProfitAndLoss(
        @Query('companyId') companyId: string,
    ): Promise<ProfitAndLossResponseDto> {
        const profitAndLoss =
            await this.getProfitAndLossUseCase.execute(companyId);

        return ProfitAndLossResponseDto.fromDomain(
            profitAndLoss,
        );
    }
}