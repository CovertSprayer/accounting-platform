import { Controller, Get, Query } from '@nestjs/common';
import { GetProfitAndLoss } from './get-profit-and-loss';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { GetBalanceSheet } from './get-balance-sheet';

@Controller('financial-statements')
export class FinancialStatementsController {
    constructor(
        private readonly getProfitAndLossUseCase: GetProfitAndLoss,
        private readonly getBalanceSheetUseCase: GetBalanceSheet,
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

    @Get('balance-sheet')
    async getBalanceSheet(
        @Query('companyId') companyId: string,
    ): Promise<BalanceSheetResponseDto> {
        const balanceSheet =
            await this.getBalanceSheetUseCase.execute(companyId);

        return BalanceSheetResponseDto.fromDomain(
            balanceSheet,
        );
    }
}