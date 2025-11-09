import { Migration } from "@mikro-orm/migrations";

export class Migration20241118120244_add_audit_logs_entity extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "audit_logs" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "actor_id" int, "entity_name" varchar(255) not null, "action_type" text check ("action_type" in (\'CREATE\', \'UPDATE\', \'DELETE\')) not null, "previous_state" jsonb not null, "current_state" jsonb not null);',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "audit_logs" cascade;');
  }
}
