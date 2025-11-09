import { Migration } from "@mikro-orm/migrations";

export class Migration20241106143817_add_verification_requests extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "verification_requests" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "token" varchar(255) not null, "expires_at" timestamptz not null, "status" text check ("status" in (\'ACTIVE\', \'EXPIRED\')) not null default \'ACTIVE\', "type" text check ("type" in (\'RESET_PASSWORD\')) not null, "user_id" int null);',
    );
    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_token_unique" unique ("token");',
    );

    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "verification_requests" cascade;');
  }
}
