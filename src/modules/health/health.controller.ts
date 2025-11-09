import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  MikroOrmHealthIndicator,
} from "@nestjs/terminus";

import {
  HEAP_MEMORY_THRESHOLD_IN_BYTES,
  RSS_MEMORY_THRESHOLD_IN_BYTES,
  STORAGE_THRESHOLD_PERCENT,
} from "./health.constants";

@Controller("health")
export class HealthController {
  constructor(
    private configService: ConfigService,
    private health: HealthCheckService,
    private mikroOrm: MikroOrmHealthIndicator,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  up() {
    return "OK";
  }

  @Get("check")
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mikroOrm.pingCheck("database"),
      () => this.http.pingCheck("api", this.configService.getOrThrow("API_HEALTH_URL")),
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: STORAGE_THRESHOLD_PERCENT,
        }),
      () => this.memory.checkHeap("memoryHeap", HEAP_MEMORY_THRESHOLD_IN_BYTES),
      () => this.memory.checkRSS("memoryRSS", RSS_MEMORY_THRESHOLD_IN_BYTES),
    ]);
  }
}
