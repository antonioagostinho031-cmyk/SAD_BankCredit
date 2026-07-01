import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    const errorResponse = {
      statusCode: status,
      message,
      error: exception.name,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${status}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} — ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage = 'Erro desconhecido';
    let errorStack = '';

    if (exception instanceof Error) {
      errorMessage = exception.message;
      errorStack = exception.stack || '';
    } else if (typeof exception === 'string') {
      errorMessage = exception;
    } else {
      try {
        errorMessage = JSON.stringify(exception);
      } catch {
        errorMessage = String(exception);
      }
    }

    this.logger.error(
      `Erro não tratado: ${request.method} ${request.url}`,
    );
    this.logger.error(`Message: ${errorMessage}`);
    this.logger.error(`Stack: ${errorStack}`);

    response.status(status).json({
      statusCode: status,
      message: 'Erro interno do servidor',
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
