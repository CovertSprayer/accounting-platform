import { ProfitAndLoss } from '../../../domain/financial-statements/profit-and-loss';

export class ProfitAndLossResponseDto {
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;

    static fromDomain(
        profitAndLoss: ProfitAndLoss,
    ): ProfitAndLossResponseDto {
        const dto = new ProfitAndLossResponseDto();

        dto.totalRevenue =
            profitAndLoss.getTotalRevenue().toString();

        dto.totalExpenses =
            profitAndLoss.getTotalExpenses().toString();

        dto.netProfit =
            profitAndLoss.getNetProfit().toString();

        return dto;
    }
}