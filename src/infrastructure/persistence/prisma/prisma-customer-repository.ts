import { Injectable } from "@nestjs/common";
import { Prisma, Customer as PrismaCustomer } from "@prisma/client";
import { Customer } from "../../../domain/customer/customer";
import { CustomerRepository } from "../../../domain/customer/customer-repository";
import { CustomerEmailAlreadyExistsError } from "../../../domain/customer/customer-email-already-exists.error";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async save(companyId: string, customer: Customer): Promise<void> {
        try {
            await this.prismaService.customer.create({
                data: {
                    id: customer.getId(),
                    companyId: companyId,
                    name: customer.getName(),
                    email: customer.getEmail(),
                    phone: customer.getPhone(),
                }
            });
        } catch (error) {
            const email = customer.getEmail();

            if (email !== null && this.isDuplicateEmailError(error)) {
                throw new CustomerEmailAlreadyExistsError(companyId, email);
            }

            throw error;
        }
    }

    async findById(companyId: string, id: string): Promise<Customer | null> {
        const data = await this.prismaService.customer.findUnique({
            where: {
                companyId_id: {
                    companyId,
                    id,
                }
            }
        });

        return data ? this.toDomain(data) : null;
    }

    async findAll(companyId: string): Promise<Customer[]> {
        const data = await this.prismaService.customer.findMany({
            where: {
                companyId,
            },
        });

        return data.map((customer) => this.toDomain(customer));
    }

    async findByEmail(companyId: string, email: string): Promise<Customer | null> {
        const data = await this.prismaService.customer.findFirst({
            where: {
                companyId,
                email,
            },
        });

        return data ? this.toDomain(data) : null;
    }

    private toDomain(data: PrismaCustomer): Customer {
        return Customer.create(
            data.id,
            data.companyId,
            data.name,
            data.email,
            data.phone,
        );
    }

    // Only the (companyId, email) unique constraint counts as a duplicate email.
    // Other unique violations (e.g. duplicate primary key) are rethrown as-is.
    private isDuplicateEmailError(error: unknown): boolean {
        if (
            !(error instanceof Prisma.PrismaClientKnownRequestError) ||
            error.code !== 'P2002'
        ) {
            return false;
        }

        const target = error.meta?.target;

        if (Array.isArray(target)) {
            return target.includes('email');
        }

        return typeof target === 'string' && target.includes('email');
    }
}
