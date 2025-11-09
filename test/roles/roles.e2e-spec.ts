import { HttpStatus, INestApplication } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import request from "supertest";

import { EUserRole } from "@/common/enums/roles.enums";

import { seedPermissionsData } from "../auth/auth.helpers";
import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getAccessToken } from "../utils/helpers/access-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";

describe("RolesController (e2e)", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  afterEach(() => {
    dbService.clear();
  });

  describe("GET /roles", () => {
    const superUserEmail = faker.internet.email();
    const superUserPassword = faker.internet.password();
    const regularUserEmail = faker.internet.email();
    const regularUserPassword = faker.internet.password();

    let superUserToken: string;
    let regularUserToken: string;

    beforeAll(async () => {
      await createUserInDb(dbService, {
        email: superUserEmail,
        password: superUserPassword,
        role: EUserRole.SUPER_USER,
      });

      await createUserInDb(dbService, {
        email: regularUserEmail,
        password: regularUserPassword,
        role: EUserRole.ADMIN,
      });

      superUserToken = await getAccessToken(httpServer, superUserEmail, superUserPassword);
      regularUserToken = await getAccessToken(httpServer, regularUserEmail, regularUserPassword);
    });

    it("returns OK(200) with roles list when super user requests", () =>
      request(httpServer)
        .get("/roles")
        .set("Authorization", `Bearer ${superUserToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0]).toEqual({
            id: expect.any(Number),
            name: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        }));

    it("returns FORBIDDEN(403) when regular user attempts to access", () =>
      request(httpServer)
        .get("/roles")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN));

    it("returns UNAUTHORIZED(401) when no token is provided", () =>
      request(httpServer).get("/roles").expect(HttpStatus.UNAUTHORIZED));
  });
});
