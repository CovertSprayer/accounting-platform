import { Account as PrismaAccount, AccountType as PrismaAccountType } from '@prisma/client';
import { Account } from '../../../domain/account/account';
import { AccountType } from '../../../domain/account/account-type';

// The single place that converts between Prisma and domain accounts.
// Used by PrismaAccountRepository and by mappers that load accounts through
// relations (journal entry lines, invoice lines).
export class AccountMapper {
    static toDomain(
        data: Pick<PrismaAccount, 'id' | 'companyId' | 'name' | 'type'>,
    ): Account {
        return Account.create(
            data.id,
            data.companyId,
            data.name,
            this.toDomainType(data.type),
        );
    }

    static toPrismaType(type: AccountType): PrismaAccountType {
        switch (type) {
            case AccountType.ASSET:
                return PrismaAccountType.ASSET;

            case AccountType.LIABILITY:
                return PrismaAccountType.LIABILITY;

            case AccountType.EQUITY:
                return PrismaAccountType.EQUITY;

            case AccountType.REVENUE:
                return PrismaAccountType.REVENUE;

            case AccountType.EXPENSE:
                return PrismaAccountType.EXPENSE;
        }
    }

    private static toDomainType(type: PrismaAccountType): AccountType {
        switch (type) {
            case PrismaAccountType.ASSET:
                return AccountType.ASSET;

            case PrismaAccountType.LIABILITY:
                return AccountType.LIABILITY;

            case PrismaAccountType.EQUITY:
                return AccountType.EQUITY;

            case PrismaAccountType.REVENUE:
                return AccountType.REVENUE;

            case PrismaAccountType.EXPENSE:
                return AccountType.EXPENSE;
        }
    }
}
