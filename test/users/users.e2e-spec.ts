import { HttpStatus, INestApplication } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import request from "supertest";

import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";
import { UpdateUserAsSuperuserDto, RegisterUserDto } from "@/modules/users/users.dtos";

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

  let superAdminRole: Role;
  let adminRole: Role;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);

    superAdminRole = await dbService.findOneOrFail(
      Role,
      { name: EUserRole.SUPER_USER },
      { disableIdentityMap: true },
    );
    adminRole = await dbService.findOneOrFail(
      Role,
      { name: EUserRole.ADMIN },
      { disableIdentityMap: true },
    );
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

  describe("GET /users/me", () => {
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

    it("returns OK(200) with user data", () =>
      request(httpServer)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: expect.any(Number),
            email: testUserEmail,
            claim: userProfile.role.name,
            claimId: userProfile.role.id,
            userProfileId: userProfile.id,
          });
        }));

    it("returns UNAUTHORIZED(401) if user is not authenticated", () =>
      request(httpServer).get("/users/me").expect(HttpStatus.UNAUTHORIZED));
  });

  describe("POST /users", () => {
    const testUserEmail = faker.internet.email();
    const testUserPassword = faker.internet.password();
    let superuserToken: string;

    beforeAll(async () => {
      await createUserInDb(dbService, {
        email: testUserEmail,
        password: testUserPassword,
        role: EUserRole.SUPER_USER,
      });

      superuserToken = await getAccessToken(httpServer, testUserEmail, testUserPassword);
    });

    it("returns CREATED(201) after creating a new user", async () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        userProfile: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          roleId: adminRole.id,
        },
      };

      const response = await request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${superuserToken}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toEqual({
        id: expect.any(Number),
        email: newUserRegistrationDto.email,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        userProfile: {
          id: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          firstName: newUserRegistrationDto.userProfile.firstName,
          lastName: newUserRegistrationDto.userProfile.lastName,
          email: newUserRegistrationDto.email,
          role: {
            id: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            name: EUserRole.ADMIN,
          },
        },
      });
    });

    it("returns BAD_REQUEST(400) if user already exists", () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: testUserEmail,
        password: testUserPassword,
        userProfile: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          roleId: superAdminRole.id,
        },
      };

      return request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${superuserToken}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("returns BAD_REQUEST(400) if dto is invalid", () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: "invalid-email",
        password: "short",
        userProfile: {
          firstName: "",
          lastName: "",
          roleId: superAdminRole.id,
        },
      };

      return request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${superuserToken}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual([
            "email must be an email",
            "password must be longer than or equal to 8 characters",
            "userProfile.firstName must be longer than or equal to 2 characters",
            "userProfile.lastName must be longer than or equal to 2 characters",
          ]);
        });
    });
  });

  describe("PATCH /users/:id", () => {
    const superUserEmail = faker.internet.email();
    const superUserPassword = faker.internet.password();
    const regularUserEmail = faker.internet.email();
    const regularUserPassword = faker.internet.password();

    let superUserToken: string;
    let regularUserToken: string;
    let userToUpdate: UserProfile;

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

      userToUpdate = await createUserInDb(dbService, {
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: EUserRole.ADMIN,
      });

      superUserToken = await getAccessToken(httpServer, superUserEmail, superUserPassword);
      regularUserToken = await getAccessToken(httpServer, regularUserEmail, regularUserPassword);
    });

    it("returns OK(200) when super user updates user data", async () => {
      const updateData: UpdateUserAsSuperuserDto = {
        password: faker.internet.password(),
        state: EUserState.INACTIVE,
        roleId: superAdminRole.id,
      };

      await request(httpServer)
        .patch(`/users/${userToUpdate.user.id}`)
        .set("Authorization", `Bearer ${superUserToken}`)
        .send(updateData)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: userToUpdate.user.id,
            email: userToUpdate.user.email,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            userProfile: expect.objectContaining({
              role: expect.objectContaining({
                id: superAdminRole.id,
                name: EUserRole.SUPER_USER,
              }),
            }),
          });
        });
    });

    it("returns UNAUTHORIZED(401) when regular user attempts to update", () =>
      request(httpServer)
        .patch(`/users/${userToUpdate.user.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({ state: EUserState.INACTIVE })
        .expect(HttpStatus.FORBIDDEN));

    it("returns NOT_FOUND(404) when user id does not exist", () =>
      request(httpServer)
        .patch("/users/999999")
        .set("Authorization", `Bearer ${superUserToken}`)
        .send({ state: EUserState.INACTIVE })
        .expect(HttpStatus.NOT_FOUND));

    it("returns BAD_REQUEST(400) when invalid data is provided", () =>
      request(httpServer)
        .patch(`/users/${userToUpdate.user.id}`)
        .set("Authorization", `Bearer ${superUserToken}`)
        .send({
          password: "short",
          state: "INVALID_STATE",
          roleId: "invalid-role-id",
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual(
            expect.arrayContaining([
              "password must be longer than or equal to 8 characters",
              "state must be one of the following values: UNREGISTERED, ACTIVE, INACTIVE",
              "roleId must be a number conforming to the specified constraints",
            ]),
          );
        }));
  });

  describe("GET /users", () => {
    const superUserEmail = faker.internet.email();
    const superUserPassword = faker.internet.password();
    const regularUserEmail = faker.internet.email();
    const regularUserPassword = faker.internet.password();

    let superUserToken: string;
    let regularUserToken: string;

    beforeAll(async () => {
      await createUserInDb(
        dbService,
        {
          email: superUserEmail,
          password: superUserPassword,
          role: EUserRole.SUPER_USER,
        },
        false,
      );

      await createUserInDb(
        dbService,
        {
          email: regularUserEmail,
          password: regularUserPassword,
          role: EUserRole.ADMIN,
        },
        false,
      );

      for (let i = 0; i < 15; i++) {
        await createUserInDb(
          dbService,
          {
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: EUserRole.ADMIN,
          },
          false,
        );
      }

      await dbService.flush();

      superUserToken = await getAccessToken(httpServer, superUserEmail, superUserPassword);
      regularUserToken = await getAccessToken(httpServer, regularUserEmail, regularUserPassword);
    });

    it("returns OK(200) with paginated users when super user requests", () =>
      request(httpServer)
        .get("/users")
        .set("Authorization", `Bearer ${superUserToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          const { data, meta } = response.body.data;
          expect(data).toBeInstanceOf(Array);
          expect(data.length).toBeLessThanOrEqual(10);
          expect(meta).toEqual({
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: expect.any(Number),
            totalPages: expect.any(Number),
            hasNextPage: expect.any(Boolean),
            hasPreviousPage: expect.any(Boolean),
          });
        }));

    it("returns OK(200) with custom pagination parameters", () =>
      request(httpServer)
        .get("/users?page=2&limit=5")
        .set("Authorization", `Bearer ${superUserToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          const { data, meta } = response.body.data;
          expect(data.length).toBeLessThanOrEqual(5);
          expect(meta).toEqual({
            currentPage: 2,
            itemsPerPage: 5,
            totalItems: expect.any(Number),
            totalPages: expect.any(Number),
            hasNextPage: expect.any(Boolean),
            hasPreviousPage: true,
          });
        }));

    it("returns FORBIDDEN(403) when regular user attempts to access", () =>
      request(httpServer)
        .get("/users")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN));

    it("returns BAD_REQUEST(400) with invalid pagination parameters", () =>
      request(httpServer)
        .get("/users?page=0&limit=0")
        .set("Authorization", `Bearer ${superUserToken}`)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual([
            "page must not be less than 1",
            "limit must not be less than 1",
          ]);
        }));
  });
});
