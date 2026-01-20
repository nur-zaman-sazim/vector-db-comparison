import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LanceDbService } from "./lancedb.service";

@Module({
  imports: [ConfigModule],
  providers: [LanceDbService],
  exports: [LanceDbService],
})
export class LanceDbModule {}
