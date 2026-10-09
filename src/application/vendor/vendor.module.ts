import { Module } from '@nestjs/common';

import { CreateVendor } from './create-vendor';
import { GetVendor } from './get-vendor';
import { ListVendors } from './list-vendors';
import { VendorController } from './vendor.controller';
import { VENDOR_REPOSITORY } from './vendor-repository.token';
import { VendorRepository } from '../../domain/vendor/vendor-repository';

import { PrismaVendorRepository } from '../../infrastructure/persistence/prisma/prisma-vendor-repository';

@Module({
    controllers: [VendorController],
    providers: [
        {
            provide: VENDOR_REPOSITORY,
            useClass: PrismaVendorRepository,
        },

        {
            provide: CreateVendor,
            useFactory: (repository: VendorRepository) => {
                return new CreateVendor(repository);
            },
            inject: [VENDOR_REPOSITORY],
        },

        {
            provide: GetVendor,
            useFactory: (repository: VendorRepository) => {
                return new GetVendor(repository);
            },
            inject: [VENDOR_REPOSITORY],
        },

        {
            provide: ListVendors,
            useFactory: (repository: VendorRepository) => {
                return new ListVendors(repository);
            },
            inject: [VENDOR_REPOSITORY],
        },
    ],
    exports: [
        VENDOR_REPOSITORY,
    ],
})
export class VendorModule { }
