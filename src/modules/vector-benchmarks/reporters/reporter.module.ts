import { Module } from '@nestjs/common';
import { JsonReporterService } from './json-reporter.service';
import { MarkdownReporterService } from './markdown-reporter.service';
import { ConsoleReporterService } from './console-reporter.service';
import { CsvReporterService } from './csv-reporter.service';

@Module({
  providers: [
    JsonReporterService,
    MarkdownReporterService,
    ConsoleReporterService,
    CsvReporterService,
  ],
  exports: [
    JsonReporterService,
    MarkdownReporterService,
    ConsoleReporterService,
    CsvReporterService,
  ],
})
export class ReporterModule {}
