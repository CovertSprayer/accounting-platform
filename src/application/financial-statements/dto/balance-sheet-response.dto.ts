import { BalanceSheet } from '../../../domain/financial-statements/balance-sheet';

export class BalanceSheetResponseDto {
    asOfDate: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    totalLiabilitiesAndEquity: string;

    static fromDomain(
        balanceSheet: BalanceSheet,
        asOfDate: Date,
    ): BalanceSheetResponseDto {
        const dto = new BalanceSheetResponseDto();

        dto.asOfDate = asOfDate.toISOString().split('T')[0];

        dto.totalAssets =
            balanceSheet.getTotalAssets().toString();

        dto.totalLiabilities =
            balanceSheet.getTotalLiabilities().toString();

        dto.totalEquity =
            balanceSheet.getTotalEquity().toString();

        dto.totalLiabilitiesAndEquity =
            balanceSheet
                .getTotalLiabilitiesAndEquity()
                .toString();

        return dto;
    }
}