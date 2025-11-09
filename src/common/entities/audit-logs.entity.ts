import { Entity, Enum, JsonType, PrimaryKey, Property } from "@mikro-orm/core";

import { EAuditAction } from "../enums/audit.enums";
import { CustomBaseEntity } from "./custom-base.entity";

@Entity({ tableName: "audit_logs" })
export class AuditLog extends CustomBaseEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ fieldName: "actor_id", nullable: true })
  actorId?: number | null;

  @Property({ fieldName: "entity_name" })
  entityName!: string;

  @Enum({ items: () => EAuditAction, fieldName: "action_type" })
  actionType!: EAuditAction;

  @Property({ type: JsonType, fieldName: "previous_state" })
  previousState: Record<string, unknown> = {};

  @Property({ type: JsonType, fieldName: "current_state" })
  currentState: Record<string, unknown> = {};
}
