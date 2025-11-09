import { Migration } from "@mikro-orm/migrations";

export class Migration20241210125806_add_user_oauths extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "user_oauths" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "sub" varchar(255) not null, "provider" text check ("provider" in (\'GOOGLE\')) not null, "provider_verified_email" boolean not null, "user_id" int not null, constraint "user_oauths_pkey" primary key ("id"));',
    );

    this.addSql(
      'alter table "user_oauths" add constraint "user_oauths_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "user_oauths" cascade;');
  }
}
