import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainValidationError } from '../../domain/shared/domain-validation.error';

@Catch(DomainValidationError)
export class DomainValidationErrorFilter implements ExceptionFilter {
    catch(error: DomainValidationError, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        response.status(HttpStatus.BAD_REQUEST).json({
            message: error.message,
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
        });
    }
}
