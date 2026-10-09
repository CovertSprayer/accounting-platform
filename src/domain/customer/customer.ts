const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Customer {
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
    ): Customer {
        if (!companyId.trim()) {
            throw new Error('Company ID cannot be empty');
        }
        if (!name.trim()) {
            throw new Error('Customer name cannot be empty');
        }

        return new Customer(
            id,
            companyId,
            name.trim(),
            Customer.normalizeEmail(email),
            Customer.normalizePhone(phone),
        );
    }

    private static normalizeEmail(email?: string | null): string | null {
        if (email === undefined || email === null) {
            return null;
        }

        const normalized = email.trim().toLowerCase();

        if (!normalized) {
            throw new Error('Customer email cannot be empty');
        }
        if (!EMAIL_PATTERN.test(normalized)) {
            throw new Error('Invalid customer email');
        }

        return normalized;
    }

    private static normalizePhone(phone?: string | null): string | null {
        if (phone === undefined || phone === null) {
            return null;
        }

        const normalized = phone.trim();

        if (!normalized) {
            throw new Error('Customer phone cannot be empty');
        }

        return normalized;
    }
}
