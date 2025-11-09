import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ChangeSet, ChangeSetType, EventSubscriber, FlushEventArgs } from "@mikro-orm/core";

import { EAuditAction } from "@/common/enums/audit.enums";

import { AuditLog } from "../entities/audit-logs.entity";
import { User } from "../entities/users.entity";
import { CHANGE_SET_TYPES_TO_PROCESS, EXCLUDED_ENTITIES } from "./audit-logging.constants";

@Injectable()
export class AuditLoggingSubscriber<T extends object = object> implements EventSubscriber<T> {
  protected readonly logger = new Logger(this.constructor.name);

  private loggedInUser: User | null = null;

  constructor(protected readonly configService: ConfigService) {}

  onFlush(args: FlushEventArgs): void {
    if (!this.isAuditLoggingEnabled()) {
      this.logger.log("Audit logging is disabled");
      return;
    }

    if (!this.loggedInUser) {
      this.logger.warn("No logged in user found, skipping audit logging");
      return;
    }

    const changeSetsFromUnitOfWork = args.uow.getChangeSets();
    const changeSetsForEntity: Array<ChangeSet<Partial<T>>> = changeSetsFromUnitOfWork.filter(
      (changeSet) =>
        CHANGE_SET_TYPES_TO_PROCESS.includes(changeSet.type) &&
        !EXCLUDED_ENTITIES.includes(changeSet.entity.constructor.name),
    );

    if (!changeSetsForEntity.length) {
      this.logger.log("No change sets found, skipping audit logging");
      return;
    }

    for (let index = 0; index < changeSetsForEntity.length; index++) {
      const currentChangeSet = changeSetsForEntity[index];

      if (!currentChangeSet.entity) continue;

      const auditEntry = new AuditLog();

      const changeSetType = this.getChangeSetType(currentChangeSet);

      if (!changeSetType) {
        this.logger.error("Invalid change set type", {
          changeSetType: currentChangeSet.type,
          entity: currentChangeSet.entity.constructor.name,
        });
        continue;
      }

      auditEntry.actionType = changeSetType;
      auditEntry.entityName = currentChangeSet.entity.constructor.name;

      if ([EAuditAction.UPDATE, EAuditAction.DELETE].includes(changeSetType)) {
        auditEntry.previousState = currentChangeSet.originalEntity ?? {};
        auditEntry.currentState = currentChangeSet.payload;
        auditEntry.actorId = this.loggedInUser.id;
      } else {
        auditEntry.currentState = currentChangeSet.payload;
        auditEntry.actorId = this.loggedInUser.id;
      }

      if (!auditEntry.actorId) {
        this.logger.warn("Actor not found", {
          entity: currentChangeSet.entity.constructor.name,
          entityId: "id" in currentChangeSet.entity ? currentChangeSet.entity["id"] : undefined,
        });
      }

      args.uow.computeChangeSet(auditEntry);
      args.uow.recomputeSingleChangeSet(currentChangeSet.entity);
    }

    this.loggedInUser = null;
  }

  setLoggedInUser(user: User): void {
    this.loggedInUser = user;
  }

  private isAuditLoggingEnabled(): boolean {
    const isAuditLoggingEnabled = this.configService.get<string>("ENABLE_AUDIT_LOGGING");
    return isAuditLoggingEnabled === "true";
  }

  private getChangeSetType(changeSet: ChangeSet<Partial<T>>): EAuditAction | null {
    switch (changeSet.type) {
      case ChangeSetType.CREATE:
        return EAuditAction.CREATE;
      case ChangeSetType.UPDATE:
      case ChangeSetType.UPDATE_EARLY:
        return EAuditAction.UPDATE;
      case ChangeSetType.DELETE:
      case ChangeSetType.DELETE_EARLY:
        return EAuditAction.DELETE;
      default:
        return null;
    }
  }
}
