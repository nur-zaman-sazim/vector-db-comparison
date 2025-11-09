import { Migration } from "@mikro-orm/migrations";

export class Migration20240316095632_create_users_user_profiles_roles_permissions extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "permissions" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" text check ("name" in (\'CREATE_USER\', \'READ_USER\', \'UPDATE_USER\', \'DELETE_USER\')) not null);',
    );

    this.addSql(
      'create table "roles" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" text check ("name" in (\'SUPER_USER\', \'ADMIN\')) not null);',
    );

    this.addSql(
      'create table "roles_permissions" ("role_id" int not null, "permission_id" int not null, constraint "roles_permissions_pkey" primary key ("role_id", "permission_id"));',
    );

    this.addSql(
      'create table "users" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "password" varchar(255) null);',
    );
    this.addSql('alter table "users" add constraint "users_email_unique" unique ("email");');

    this.addSql(
      'create table "user_profiles" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "user_id" int not null, "role_id" int not null);',
    );
    this.addSql(
      'alter table "user_profiles" add constraint "user_profiles_user_id_unique" unique ("user_id");',
    );

    this.addSql(
      'alter table "roles_permissions" add constraint "roles_permissions_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "roles_permissions" add constraint "roles_permissions_permission_id_foreign" foreign key ("permission_id") references "permissions" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "user_profiles" add constraint "user_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "user_profiles" add constraint "user_profiles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "roles_permissions" drop constraint "roles_permissions_permission_id_foreign";',
    );

    this.addSql(
      'alter table "roles_permissions" drop constraint "roles_permissions_role_id_foreign";',
    );

    this.addSql('alter table "user_profiles" drop constraint "user_profiles_role_id_foreign";');

    this.addSql('alter table "user_profiles" drop constraint "user_profiles_user_id_foreign";');

    this.addSql('drop table if exists "permissions" cascade;');

    this.addSql('drop table if exists "roles" cascade;');

    this.addSql('drop table if exists "roles_permissions" cascade;');

    this.addSql('drop table if exists "users" cascade;');

    this.addSql('drop table if exists "user_profiles" cascade;');
  }
}
