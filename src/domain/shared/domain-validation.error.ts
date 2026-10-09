// Thrown when a domain object would violate a business rule.
// The HTTP layer maps it to 400; any other Error remains a 500.
export class DomainValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainValidationError';
    }
}
