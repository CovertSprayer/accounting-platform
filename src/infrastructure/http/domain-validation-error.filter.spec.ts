import { ArgumentsHost } from '@nestjs/common';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';
import { DomainValidationErrorFilter } from './domain-validation-error.filter';

describe('DomainValidationErrorFilter', () => {
    it('should respond with 400 and the domain error message', () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
            }),
        } as unknown as ArgumentsHost;

        new DomainValidationErrorFilter().catch(
            new DomainValidationError('Customer name cannot be empty'),
            host,
        );

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            message: 'Customer name cannot be empty',
            error: 'Bad Request',
            statusCode: 400,
        });
    });
});
