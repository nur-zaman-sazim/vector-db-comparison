import { Migration } from "@mikro-orm/migrations";

export class Migration20241106143703_add_state_verified_at_and_first_login_at_to_users extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "users" add column "state" text check ("state" in (\'UNREGISTERED\', \'ACTIVE\', \'INACTIVE\')) not null default \'ACTIVE\', add column "verified_at" varchar(255) null, add column "first_login_at" varchar(255) null;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "users" drop column "state", drop column "verified_at", drop column "first_login_at";',
    );
  }
}
