import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { User } from "@/common/entities/users.entity";
import { RolesModule } from "@/modules/roles/roles.module";

import { EmailsModule } from "../emails/emails.module";
import { VerificationRequestsModule } from "../verification-requests/verification-requests.module";
import { UsersController } from "./users.controller";
import { UsersSerializer } from "./users.serializer";
import { UsersService } from "./users.service";

@Module({
  imports: [
    RolesModule,
    MikroOrmModule.forFeature([User]),
    VerificationRequestsModule,
    EmailsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersSerializer],
  exports: [UsersService, UsersSerializer, MikroOrmModule.forFeature([User])],
})
export class UsersModule {}
