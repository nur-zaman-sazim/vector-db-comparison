import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Permission } from "@/common/entities/permissions.entity";

@Module({
  imports: [MikroOrmModule.forFeature([Permission])],
  exports: [MikroOrmModule.forFeature([Permission])],
})
export class PermissionsModule {}
