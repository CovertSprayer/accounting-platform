import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { NotFoundError } from '../../application/shared/not-found.error';

@Catch(NotFoundError)
export class NotFoundErrorFilter implements ExceptionFilter {
    catch(error: NotFoundError, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        response.status(HttpStatus.NOT_FOUND).json({
            message: error.message,
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
        });
    }
}
