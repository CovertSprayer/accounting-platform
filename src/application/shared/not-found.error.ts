// Thrown when the resource a use case was asked to act on does not exist.
// The HTTP layer maps it to 404.
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}
