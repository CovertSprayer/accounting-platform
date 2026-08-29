
export class Company {
    constructor(
        private readonly id: string,
        private name: string
    ) { }

    static create(id: string, name: string): Company {
        if (!name.trim()) {
            throw new Error('Company name cannot be empty');
        }

        return new Company(id, name.trim());
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    rename(name: string): void {
        if (!name.trim()) {
            throw new Error('Company name cannot be empty');
        }

        this.name = name.trim();
    }
}