import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from "@nestjs/common";

import { Response } from "express";

@Catch(HttpException)
export class CustomBaseExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const cause = exception.cause ?? [];

    this.logger.error(exception.message, exception.stack, {
      statusCode: status,
      message: exception.message,
      cause,
      response: exception.getResponse(),
    });

    if (Array.isArray(cause)) {
      return response.status(status).json({
        statusCode: status,
        errors: cause,
        message: exception.message,
      });
    }

    return response.status(status).json({
      statusCode: status,
      errors: [exception.cause],
      message: exception.message,
    });
  }
}
