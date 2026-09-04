import { BalanceSheet } from '../../../domain/financial-statements/balance-sheet';

export class BalanceSheetResponseDto {
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    totalLiabilitiesAndEquity: string;

    static fromDomain(
        balanceSheet: BalanceSheet,
    ): BalanceSheetResponseDto {
        const dto = new BalanceSheetResponseDto();

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