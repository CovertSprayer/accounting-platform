import { DomainValidationError } from '../shared/domain-validation.error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Vendor {
    constructor(
        private readonly id: string,
        private readonly companyId: string,
        private readonly name: string,
        private readonly email: string | null,
        private readonly phone: string | null,
    ) { }

    getId(): string {
        return this.id;
    }

    getCompanyId(): string {
        return this.companyId;
    }

    getName(): string {
        return this.name;
    }

    getEmail(): string | null {
        return this.email;
    }

    getPhone(): string | null {
        return this.phone;
    }

    static create(
        id: string,
        companyId: string,
        name: string,
        email?: string | null,
        phone?: string | null,
    ): Vendor {
        if (!companyId.trim()) {
            throw new DomainValidationError('Company ID cannot be empty');
        }
        if (!name.trim()) {
            throw new DomainValidationError('Vendor name cannot be empty');
        }

        return new Vendor(
            id,
            companyId,
            name.trim(),
            Vendor.normalizeEmail(email),
            Vendor.normalizePhone(phone),
        );
    }

    private static normalizeEmail(email?: string | null): string | null {
        if (email === undefined || email === null) {
            return null;
        }

        const normalized = email.trim().toLowerCase();

        if (!normalized) {
            throw new DomainValidationError('Vendor email cannot be empty');
        }
        if (!EMAIL_PATTERN.test(normalized)) {
            throw new DomainValidationError('Invalid vendor email');
        }

        return normalized;
    }

    private static normalizePhone(phone?: string | null): string | null {
        if (phone === undefined || phone === null) {
            return null;
        }

        const normalized = phone.trim();

        if (!normalized) {
            throw new DomainValidationError('Vendor phone cannot be empty');
        }

        return normalized;
    }
}
