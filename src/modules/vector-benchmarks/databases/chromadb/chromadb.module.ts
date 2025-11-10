import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbService } from './chromadb.service';

@Module({
  imports: [ConfigModule],
  providers: [ChromaDbService],
  exports: [ChromaDbService],
})
export class ChromaDbModule {}
