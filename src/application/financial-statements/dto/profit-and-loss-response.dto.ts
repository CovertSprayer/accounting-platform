import { ProfitAndLoss } from '../../../domain/financial-statements/profit-and-loss';

export class ProfitAndLossResponseDto {
    periodStart: string;
    periodEnd: string;
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;

    static fromDomain(
        profitAndLoss: ProfitAndLoss,
        periodStart: Date,
        periodEnd: Date,
    ): ProfitAndLossResponseDto {
        const dto = new ProfitAndLossResponseDto();

        dto.periodStart = periodStart.toISOString().split('T')[0];
        dto.periodEnd = periodEnd.toISOString().split('T')[0];

        dto.totalRevenue =
            profitAndLoss.getTotalRevenue().toString();

        dto.totalExpenses =
            profitAndLoss.getTotalExpenses().toString();

        dto.netProfit =
            profitAndLoss.getNetProfit().toString();

        return dto;
    }
}