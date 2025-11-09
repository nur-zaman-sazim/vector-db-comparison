import { HttpStatus, INestApplication } from "@nestjs/common";

import { Connection, EntityManager, IDatabaseDriver, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import request from "supertest";

import { VerificationRequest } from "@/common/entities/verification-requests.entity";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";

import { seedPermissionsData } from "../auth/auth.helpers";
import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { VerificationRequestFactory } from "../utils/factories/verification-requests.factory";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";

describe("VerificationRequestsController (e2e)", () => {
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

  describe("POST /verification-requests/verify/:token", () => {
    it("returns OK(200) when verifying a valid email verification token", async () => {
      const userProfile = await createUserInDb(dbService, {
        email: faker.internet.email(),
        password: faker.internet.password(),
      });

      const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
        user: userProfile.user,
        type: EVerificationRequestType.EMAIL_VERIFICATION,
      });

      await dbService.flush();

      await request(httpServer)
        .post(`/verification-requests/verify/${verificationRequest.token}`)
        .query({ type: EVerificationRequestType.EMAIL_VERIFICATION })
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            message: "Verification successful",
          });
        });

      const updatedVerificationRequest = await dbService.findOneOrFail(
        VerificationRequest,
        {
          token: verificationRequest.token,
        },
        {
          disableIdentityMap: true,
        },
      );

      expect(updatedVerificationRequest.status).toBe(EVerificationRequestStatus.EXPIRED);
      expect(updatedVerificationRequest.expiresAt).toBeDefined();
    });

    it("returns BAD_REQUEST(400) when token is expired", async () => {
      const userProfile = await createUserInDb(dbService, {
        email: faker.internet.email(),
        password: faker.internet.password(),
      });

      const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
        user: userProfile.user,
        type: EVerificationRequestType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      await dbService.flush();

      return request(httpServer)
        .post(`/verification-requests/verify/${verificationRequest.token}`)
        .query({ type: EVerificationRequestType.EMAIL_VERIFICATION })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("returns BAD_REQUEST(400) when verification type is invalid", async () => {
      const userProfile = await createUserInDb(dbService, {
        email: faker.internet.email(),
        password: faker.internet.password(),
      });

      const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
        user: userProfile.user,
        type: EVerificationRequestType.RESET_PASSWORD,
      });

      await dbService.flush();

      return request(httpServer)
        .post(`/verification-requests/verify/${verificationRequest.token}`)
        .query({ type: EVerificationRequestType.RESET_PASSWORD })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe("GET /verification-requests/:token", () => {
    it("returns OK(200) with verification request details", async () => {
      const userProfile = await createUserInDb(dbService, {
        email: faker.internet.email(),
        password: faker.internet.password(),
      });

      const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
        user: userProfile.user,
        type: EVerificationRequestType.EMAIL_VERIFICATION,
      });

      await dbService.flush();

      return request(httpServer)
        .get(`/verification-requests/${verificationRequest.token}`)
        .query({ type: EVerificationRequestType.EMAIL_VERIFICATION })
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toMatchObject({
            id: expect.any(Number),
            token: verificationRequest.token,
            type: EVerificationRequestType.EMAIL_VERIFICATION,
            user: expect.objectContaining({
              id: userProfile.user.id,
            }),
          });
        });
    });

    it("returns NOT_FOUND(404) when token does not exist", () =>
      request(httpServer)
        .get("/verification-requests/non-existent-token")
        .query({ type: EVerificationRequestType.EMAIL_VERIFICATION })
        .expect(HttpStatus.NOT_FOUND));

    it("returns BAD_REQUEST(400) when type parameter is invalid", () =>
      request(httpServer)
        .get("/verification-requests/some-token")
        .query({ type: "INVALID_TYPE" })
        .expect(HttpStatus.BAD_REQUEST));
  });
});
