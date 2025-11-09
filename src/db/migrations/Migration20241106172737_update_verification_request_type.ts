import { Migration } from "@mikro-orm/migrations";

export class Migration20241106172737_update_verification_request_type extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "verification_requests" drop constraint if exists "verification_requests_type_check";',
    );

    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_type_check" check("type" in (\'EMAIL_VERIFICATION\', \'RESET_PASSWORD\'));',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "verification_requests" drop constraint if exists "verification_requests_type_check";',
    );

    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_type_check" check("type" in (\'RESET_PASSWORD\'));',
    );
  }
}
