import { Controller, Get, Query } from '@nestjs/common';
import { GetProfitAndLoss } from './get-profit-and-loss';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { ProfitAndLossQueryDto } from './dto/profit-and-loss-query.dto';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { BalanceSheetQueryDto } from './dto/balance-sheet-query.dto';
import { GetBalanceSheet } from './get-balance-sheet';

@Controller('financial-statements')
export class FinancialStatementsController {
    constructor(
        private readonly getProfitAndLossUseCase: GetProfitAndLoss,
        private readonly getBalanceSheetUseCase: GetBalanceSheet,
    ) { }

    @Get('profit-and-loss')
    async getProfitAndLoss(
        @Query() query: ProfitAndLossQueryDto,
    ): Promise<ProfitAndLossResponseDto> {
        const fromDate = new Date(query.fromDate);
        const toDate = new Date(query.toDate);

        const profitAndLoss = await this.getProfitAndLossUseCase.execute(
            query.companyId,
            fromDate,
            toDate,
        );

        return ProfitAndLossResponseDto.fromDomain(
            profitAndLoss,
            fromDate,
            toDate,
        );
    }

    @Get('balance-sheet')
    async getBalanceSheet(
        @Query() query: BalanceSheetQueryDto,
    ): Promise<BalanceSheetResponseDto> {
        const asOfDate = new Date(query.asOfDate);

        const balanceSheet = await this.getBalanceSheetUseCase.execute(
            query.companyId,
            asOfDate,
        );

        return BalanceSheetResponseDto.fromDomain(
            balanceSheet,
            asOfDate,
        );
    }
}