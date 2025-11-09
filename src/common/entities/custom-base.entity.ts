import { Entity, OptionalProps, Property } from "@mikro-orm/core";

@Entity({ abstract: true })
export abstract class CustomBaseEntity {
  [OptionalProps]?: "createdAt" | "updatedAt";

  @Property({ fieldName: "created_at" })
  createdAt: Date = new Date();

  @Property({ fieldName: "updated_at", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
