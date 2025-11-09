import {
  INestApplication,
  Controller,
  Get,
  UseGuards,
  ValidationPipe,
  HttpStatus,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TestingModule, Test } from "@nestjs/testing";

import { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { faker } from "@faker-js/faker";
import request from "supertest";
import { mockDeep } from "vitest-mock-extended";

import { EUserRole, EPermission } from "@/common/enums/roles.enums";
import ormConfig from "@/db/db.config";
import { AuthModule } from "@/modules/auth/auth.module";
import { Permissions } from "@/modules/auth/decorators/permissions.decorator";
import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RolesGuard } from "@/modules/auth/guards/roles.guard";
import { GoogleStrategy } from "@/modules/auth/strategies/google.strategy";
import { IEmailService } from "@/modules/emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "@/modules/emails/emails.constants";
import { EmailsModule } from "@/modules/emails/emails.module";
import { RolesModule } from "@/modules/roles/roles.module";
import { RolesService } from "@/modules/roles/roles.service";
import { UserProfilesModule } from "@/modules/user-profiles/user-profiles.module";
import { UsersModule } from "@/modules/users/users.module";
import { VerificationRequestsModule } from "@/modules/verification-requests/verification-requests.module";
import { PermissionsModule } from "@/permissions/permissions.module";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { seedPermissionsData } from "./auth.helpers";
import { MOCK_AUTH_EMAIL, MOCK_AUTH_PASS } from "./auth.mock";

describe("Authorization", () => {
  let authorizationApp: INestApplication;
  let authorizationHttpServer: Awaited<
    ReturnType<typeof bootstrapTestServer>
  >["httpServerInstance"];
  let dbService: EntityManager<IDatabaseDriver<Connection>>;

  beforeAll(async () => {
    @Controller("dummy")
    class DummyController {
      @Get("/requires-sign-in")
      @UseGuards(JwtAuthGuard)
      public requiresSignIn() {
        return "You're logged in!";
      }

      @Get("/requires-specific-role")
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(EUserRole.SUPER_USER)
      public requiresSpecificRole() {
        return "You have the required role!";
      }

      @Get("/requires-specific-permission")
      @UseGuards(JwtAuthGuard, PermissionsGuard)
      @Permissions(EPermission.DELETE_USER)
      public requiresSpecificPermission() {
        return "You have the required permission!";
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot(ormConfig),
        ConfigModule.forRoot({ isGlobal: true }),
        UsersModule,
        UserProfilesModule,
        PermissionsModule,
        AuthModule,
        RolesModule,
        EmailsModule,
        VerificationRequestsModule,
      ],
      controllers: [DummyController],
      providers: [RolesService],
    })
      .overrideProvider(EMAIL_SERVICE_TOKEN)
      .useValue(mockDeep<IEmailService>({ funcPropSupport: true }))
      .overrideProvider(ConfigService)
      .useValue(mockDeep<ConfigService>({ funcPropSupport: true }))
      .overrideProvider(GoogleStrategy)
      .useValue(mockDeep<GoogleStrategy>({ funcPropSupport: true }))
      .compile();

    authorizationApp = moduleFixture.createNestApplication();
    authorizationApp.useGlobalPipes(new ValidationPipe({ transform: true }));
    authorizationHttpServer = authorizationApp.getHttpServer();
    await authorizationApp.init();
    const orm = await MikroORM.init(ormConfig);
    dbService = orm.em.fork();

    await seedPermissionsData(dbService);

    await createUserInDb(dbService, {
      email: MOCK_AUTH_EMAIL,
      password: MOCK_AUTH_PASS,
    });
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await authorizationHttpServer.close();
    await authorizationApp.close();
  });

  describe("GET /dummy/requires-sign-in", () => {
    it("should return 401 Unauthorized without proper token", () =>
      request(authorizationHttpServer)
        .get("/dummy/requires-sign-in")
        .expect(HttpStatus.UNAUTHORIZED));

    it("should return 200 OK with proper token", async () => {
      const email = faker.internet.email();
      await createUserInDb(dbService, {
        email,
      });

      const { body } = await request(authorizationHttpServer)
        .post("/auth/sign-in")
        .send(`email=${MOCK_AUTH_EMAIL}&password=${MOCK_AUTH_PASS}`)
        .expect(HttpStatus.CREATED);

      return request(authorizationHttpServer)
        .get("/dummy/requires-sign-in")
        .set("Authorization", `Bearer ${body.data.accessToken}`)
        .expect(HttpStatus.OK)
        .expect(({ text }) => expect(text).toEqual("You're logged in!"));
    });
  });

  describe("GET /dummy/requires-specific-permission", () => {
    it("should return 403 Forbidden with proper token but without permission", async () => {
      const email = faker.internet.email();

      await createUserInDb(dbService, {
        email,
        role: EUserRole.ADMIN,
      });

      const { body } = await request(authorizationHttpServer)
        .post("/auth/sign-in")
        .send(`email=${email}&password=${MOCK_AUTH_PASS}`)
        .expect(HttpStatus.CREATED);

      return request(authorizationHttpServer)
        .get("/dummy/requires-specific-permission")
        .set("Authorization", `Bearer ${body.data.accessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect(({ body }) => expect(body.message).toEqual("Forbidden resource"));
    });

    it("should return 200 OK with proper token and permission", async () => {
      const email = faker.internet.email();

      await createUserInDb(dbService, {
        email,
        role: EUserRole.SUPER_USER,
      });

      const { body } = await request(authorizationHttpServer)
        .post("/auth/sign-in")
        .send(`email=${email}&password=${MOCK_AUTH_PASS}`)
        .expect(HttpStatus.CREATED);

      return request(authorizationHttpServer)
        .get("/dummy/requires-specific-permission")
        .set("Authorization", `Bearer ${body.data.accessToken}`)
        .expect(HttpStatus.OK)
        .expect(({ text }) => expect(text).toEqual("You have the required permission!"));
    });
  });

  describe("GET /dummy/requires-specific-role", () => {
    it("should return 403 Forbidden with proper token but without role", async () => {
      const email = faker.internet.email();

      await createUserInDb(dbService, {
        email,
        role: EUserRole.ADMIN,
      });

      const { body } = await request(authorizationHttpServer)
        .post("/auth/sign-in")
        .send(`email=${email}&password=${MOCK_AUTH_PASS}`)
        .expect(HttpStatus.CREATED);

      return request(authorizationHttpServer)
        .get("/dummy/requires-specific-role")
        .set("Authorization", `Bearer ${body.data.accessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect(({ body }) => expect(body.message).toEqual("Forbidden resource"));
    });

    it("should return 200 OK with proper token and role", async () => {
      const email = faker.internet.email();

      await createUserInDb(dbService, {
        email,
        role: EUserRole.SUPER_USER,
      });

      const { body } = await request(authorizationHttpServer)
        .post("/auth/sign-in")
        .send(`email=${email}&password=${MOCK_AUTH_PASS}`)
        .expect(HttpStatus.CREATED);

      return request(authorizationHttpServer)
        .get("/dummy/requires-specific-role")
        .set("Authorization", `Bearer ${body.data.accessToken}`)
        .expect(HttpStatus.OK)
        .expect(({ text }) => expect(text).toEqual("You have the required role!"));
    });
  });
});
