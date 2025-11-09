import { INestApplication, HttpStatus } from "@nestjs/common";

import { Connection, EntityManager, IDatabaseDriver, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import request from "supertest";

import { UserProfile } from "@/common/entities/user-profiles.entity";

import { seedPermissionsData } from "../auth/auth.helpers";
import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getAccessToken } from "../utils/helpers/access-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";

describe("UsersController (e2e)", () => {
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

  describe("PATCH /user-profiles/me", () => {
    const testUserEmail = faker.internet.email();
    const testUserPassword = faker.internet.password();

    let token: string;
    let userProfile: UserProfile;

    beforeAll(async () => {
      userProfile = await createUserInDb(dbService, {
        email: testUserEmail,
        password: testUserPassword,
      });
      token = await getAccessToken(httpServer, testUserEmail, testUserPassword);
    });

    it("returns OK(200) after updating user profile", () => {
      const updateDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      return request(httpServer)
        .patch("/user-profiles/me")
        .set("Authorization", `Bearer ${token}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: userProfile.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            firstName: updateDto.firstName,
            lastName: updateDto.lastName,
            email: testUserEmail,
            role: {
              id: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              name: expect.any(String),
            },
          });
        });
    });

    it("returns UNAUTHORIZED(401) if user is not authenticated", () =>
      request(httpServer)
        .patch("/user-profiles/me")
        .send({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
        })
        .expect(HttpStatus.UNAUTHORIZED));

    it("returns BAD_REQUEST(400) if dto is invalid", () =>
      request(httpServer)
        .patch("/user-profiles/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "",
          lastName: "",
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual([
            "firstName must be longer than or equal to 2 characters",
            "lastName must be longer than or equal to 2 characters",
          ]);
        }));
  });

  describe("GET /user-profiles/me", () => {
    const testUserEmail = faker.internet.email();
    const testUserPassword = faker.internet.password();

    let token: string;
    let userProfile: UserProfile;

    beforeAll(async () => {
      userProfile = await createUserInDb(dbService, {
        email: testUserEmail,
        password: testUserPassword,
      });
      token = await getAccessToken(httpServer, testUserEmail, testUserPassword);
    });

    it("returns OK(200) and user profile data", () =>
      request(httpServer)
        .get("/user-profiles/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: userProfile.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: testUserEmail,
            role: {
              id: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              name: expect.any(String),
            },
          });
        }));

    it("returns UNAUTHORIZED(401) if user is not authenticated", () =>
      request(httpServer).get("/user-profiles/me").expect(HttpStatus.UNAUTHORIZED));
  });
});
