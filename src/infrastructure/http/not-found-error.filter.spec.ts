import { ArgumentsHost } from '@nestjs/common';
import { NotFoundError } from '../../application/shared/not-found.error';
import { NotFoundErrorFilter } from './not-found-error.filter';

describe('NotFoundErrorFilter', () => {
    it('should respond with 404 and the error message', () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
            }),
        } as unknown as ArgumentsHost;

        new NotFoundErrorFilter().catch(
            new NotFoundError('Account not found: cash'),
            host,
        );

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({
            message: 'Account not found: cash',
            error: 'Not Found',
            statusCode: 404,
        });
    });
});
