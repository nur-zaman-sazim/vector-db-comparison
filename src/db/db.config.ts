import { NotFoundException } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { Dictionary, ReflectMetadataProvider } from "@mikro-orm/core";
import { IPrimaryKeyValue } from "@mikro-orm/core/typings";
import { Migrator, TSMigrationGenerator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";

import * as fs from "fs";
import * as path from "path";

const ormConfig = defineConfig({
  entities: [path.resolve(process.cwd(), "dist/**/*.entity.js")],
  entitiesTs: [path.resolve(process.cwd(), "src/**/*.entity.ts")],

  metadataProvider: ReflectMetadataProvider,

  clientUrl: process.env.DATABASE_URL,

  extensions: [Migrator, SeedManager],

  ...(process.env.STAGE_ENV === "test" ? { dynamicImportProvider: (id) => import(id) } : {}),

  validate: true,
  strict: true,
  debug: true,

  driverOptions: {
    connection: {
      keepAlive: true,
      ...(process.env.STAGE_ENV === "production"
        ? {
            ssl: {
              ca: fs
                .readFileSync(path.resolve(process.cwd(), "certs/db-ca-certificate.crt"))
                .toString(),
            },
          }
        : {}),
    },
  },

  schemaGenerator: {
    disableForeignKeys: false,
  },

  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 10000,
  },

  migrations: {
    tableName: "mikro_orm_migrations",
    path: "./dist/src/db/migrations",
    pathTs: "./src/db/migrations",
    glob: "!(*.d).{js,ts}",
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    snapshot: true,
    snapshotName: ".snapshot",
    emit: "ts",
    generator: TSMigrationGenerator,
    fileName: (timestamp: string, name?: string) => {
      if (!name) {
        throw new Error("Specify migration name via `--name=...`");
      }
      return `Migration${timestamp}_${name}`;
    },
  },

  seeder: {
    path: "./dist/src/db/seeders",
    pathTs: "./src/db/seeders",
    glob: "!(*.d).{js,ts}",
    emit: "js",
    fileName: (className: string) => className,
  },

  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKeyValue) => {
    Logger.debug(`Entity ${entityName} not found with where ${JSON.stringify(where)}`);
    return new NotFoundException();
  },
  findExactlyOneOrFailHandler(entityName: string, where: Dictionary | IPrimaryKeyValue) {
    Logger.debug(`Entity ${entityName} not found with where ${JSON.stringify(where)}`);
    return new NotFoundException();
  },

  logger(message: string) {
    Logger.debug(message);
  },

  ignoreUndefinedInQuery: true,
});

export default ormConfig;
