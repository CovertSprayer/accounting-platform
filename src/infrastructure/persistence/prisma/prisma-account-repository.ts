import { Injectable } from "@nestjs/common";
import { Account } from "../../../domain/account/account";
import { AccountRepository } from "../../../domain/account/account-repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AccountType } from "../../../domain/account/account-type";
import { AccountType as PrismaAccountType } from "@prisma/client";


@Injectable()
export class PrismaAccountRepository implements AccountRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async save(companyId: string, account: Account): Promise<void> {
        await this.prismaService.account.create({
            data: {
                id: account.getId(),
                name: account.getName(),
                type: this.toPrismaAccountType(account.getType()),
                companyId: companyId,
            }
        })
    }

    async findById(companyId: string, id: string): Promise<Account | null> {
        const data = await this.prismaService.account.findUnique({
            where: {
                companyId_id: {
                    companyId,
                    id,
                }
            }
        });

        if (!data) {
            return null;
        }

        return Account.create(
            data.id,
            data.companyId,
            data.name,
            this.toDomainAccountType(data.type)
        );
    }

    async findAll(companyId: string): Promise<Account[]> {
        const data = await this.prismaService.account.findMany({
            where: {
                companyId,
            },
        });

        return data.map((account) =>
            Account.create(
                account.id,
                account.companyId,
                account.name,
                this.toDomainAccountType(account.type),
            ),
        );
    }

    private toDomainAccountType(
        type: PrismaAccountType,
    ): AccountType {
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

    private toPrismaAccountType(
        type: AccountType,
    ): PrismaAccountType {
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
}