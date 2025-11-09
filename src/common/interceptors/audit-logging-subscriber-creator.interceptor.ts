import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";

import { Observable } from "rxjs";

import { AuditLoggingSubscriber } from "../audit-logging/audit-logging.subscriber";
import { User } from "../entities/users.entity";

@Injectable()
export class AuditLoggingSubscriberCreatorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly auditLoggingSubscriber: AuditLoggingSubscriber) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const user = context.switchToHttp().getRequest().user as User;

    if (!user) {
      this.logger.log("No user found in request, cannot create audit logging subscriber");
      return next.handle();
    }

    this.logger.log("Setting logged in user for audit logging subscriber, current user id: ", {
      id: user.id,
    });

    this.auditLoggingSubscriber.setLoggedInUser(user);

    return next.handle();
  }
}
