import { Injectable, NestMiddleware, Logger } from "@nestjs/common";

import { Request, Response, NextFunction } from "express";

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(this.constructor.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl: url, query } = request;
    const userAgent = request.get("user-agent") || "";
    const queryParams = JSON.stringify(query);

    response.on("close", () => {
      const { statusCode } = response;
      const contentLength = response.get("content-length");
      const logMessage = `Method: ${method.toUpperCase()}, Path: ${url}, Status Code: ${statusCode}, Content Length: ${contentLength}, User Agent: ${userAgent}, Query Params: ${queryParams}`;

      if (statusCode >= 400) {
        const errorMessage = response.statusMessage || "Unknown error";
        this.logger.error(`${logMessage}, Error: ${errorMessage}`);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
