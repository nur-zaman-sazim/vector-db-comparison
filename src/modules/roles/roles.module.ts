import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Role } from "@/common/entities/roles.entity";
import { PermissionsModule } from "@/permissions/permissions.module";

import { UserProfilesModule } from "../user-profiles/user-profiles.module";
import { RolesController } from "./roles.controller";
import { RolesSerializer } from "./roles.serializer";
import { RolesService } from "./roles.service";

@Module({
  imports: [PermissionsModule, UserProfilesModule, MikroOrmModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [RolesService, RolesSerializer],
  exports: [RolesService, MikroOrmModule.forFeature([Role])],
})
export class RolesModule {}
