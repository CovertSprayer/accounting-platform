import { Injectable } from "@nestjs/common";
import { Account } from "../../../domain/account/account";
import { AccountRepository } from "../../../domain/account/account-repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AccountMapper } from "./account.mapper";


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
                type: AccountMapper.toPrismaType(account.getType()),
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

        return AccountMapper.toDomain(data);
    }

    async findAll(companyId: string): Promise<Account[]> {
        const data = await this.prismaService.account.findMany({
            where: {
                companyId,
            },
        });

        return data.map((account) => AccountMapper.toDomain(account));
    }
}
