import { Injectable } from "@nestjs/common";
import { Prisma, Vendor as PrismaVendor } from "@prisma/client";
import { Vendor } from "../../../domain/vendor/vendor";
import { VendorRepository } from "../../../domain/vendor/vendor-repository";
import { VendorEmailAlreadyExistsError } from "../../../domain/vendor/vendor-email-already-exists.error";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

@Injectable()
export class PrismaVendorRepository implements VendorRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async save(companyId: string, vendor: Vendor): Promise<void> {
        try {
            await this.prismaService.vendor.create({
                data: {
                    id: vendor.getId(),
                    companyId: companyId,
                    name: vendor.getName(),
                    email: vendor.getEmail(),
                    phone: vendor.getPhone(),
                }
            });
        } catch (error) {
            const email = vendor.getEmail();

            if (email !== null && this.isDuplicateEmailError(error)) {
                throw new VendorEmailAlreadyExistsError(companyId, email);
            }

            throw error;
        }
    }

    async findById(companyId: string, id: string): Promise<Vendor | null> {
        const data = await this.prismaService.vendor.findUnique({
            where: {
                companyId_id: {
                    companyId,
                    id,
                }
            }
        });

        return data ? this.toDomain(data) : null;
    }

    async findAll(companyId: string): Promise<Vendor[]> {
        const data = await this.prismaService.vendor.findMany({
            where: {
                companyId,
            },
        });

        return data.map((vendor) => this.toDomain(vendor));
    }

    async findByEmail(companyId: string, email: string): Promise<Vendor | null> {
        const data = await this.prismaService.vendor.findFirst({
            where: {
                companyId,
                email,
            },
        });

        return data ? this.toDomain(data) : null;
    }

    private toDomain(data: PrismaVendor): Vendor {
        return Vendor.create(
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
