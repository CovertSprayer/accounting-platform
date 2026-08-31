import { Account } from 'src/domain/account/account';
import { AccountType } from 'src/domain/account/account-type';

export class AccountResponseDto {
    id: string;
    companyId: string;
    name: string;
    type: AccountType;

    static fromDomain(
        account: Account,
    ): AccountResponseDto {
        return {
            id: account.getId(),
            companyId: account.getCompanyId(),
            name: account.getName(),
            type: account.getType(),
        };
    }
}
