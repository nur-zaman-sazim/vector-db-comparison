import { HttpStatus, INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { IDatabaseDriver, Connection, EntityManager, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import request from "supertest";
import { DeepMockProxy } from "vitest-mock-extended";

import { User } from "@/common/entities/users.entity";
import { VerificationRequest } from "@/common/entities/verification-requests.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";
import { IEmailService } from "@/modules/emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "@/modules/emails/emails.constants";
import * as cryptoHelpers from "@/utils/crypto-helper";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { UserFactory, UserProfileFactory } from "../utils/factories/users.factory";
import { VerificationRequestFactory } from "../utils/factories/verification-requests.factory";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";
import { seedPermissionsData } from "./auth.helpers";
import { MOCK_AUTH_EMAIL, MOCK_AUTH_PASS } from "./auth.mock";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;
  let mockEmailsService: DeepMockProxy<IEmailService>;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);

    mockEmailsService = app.get<DeepMockProxy<IEmailService>>(EMAIL_SERVICE_TOKEN);
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  describe("Authentication", () => {
    beforeAll(async () => {
      await createUserInDb(dbService);
    });

    describe("POST /auth/sign-in", () => {
      it("should return 201 Created with proper credentials", () =>
        request(httpServer)
          .post("/auth/sign-in")
          .send(`email=${MOCK_AUTH_EMAIL}&password=${MOCK_AUTH_PASS}`)
          .expect(HttpStatus.CREATED)
          .expect(({ body }) => {
            expect(body.data.user.email).toEqual(MOCK_AUTH_EMAIL);
            expect(body.data).toHaveProperty("accessToken");
            expect(body.data.user.password).toBeUndefined();
          }));

      it("should return 401 Unauthorized with wrong credentials", () =>
        request(httpServer)
          .post("/auth/sign-in")
          .send(`email=${MOCK_AUTH_EMAIL}&password=wrongpassword`)
          .expect(HttpStatus.UNAUTHORIZED));

      it("Without authentication params, gets back 401 Unauthenticated", () =>
        request(httpServer).post("/auth/sign-in").expect(HttpStatus.UNAUTHORIZED));
    });
  });

  describe("Forgot Password", () => {
    describe("POST /auth/forgot-password", () => {
      it("should return BAD_REQUEST(400) when email is not provided", () =>
        request(httpServer).post("/auth/forgot-password").expect(HttpStatus.BAD_REQUEST));

      it("should return NOT_FOUND(404) when no user exists for provided valid email", () =>
        request(httpServer)
          .post("/auth/forgot-password")
          .send("email=valid@email.com")
          .expect(HttpStatus.NOT_FOUND));

      it("should return CREATED(201) when a valid email associated to active user is provided", () =>
        request(httpServer)
          .post("/auth/forgot-password")
          .send(`email=${MOCK_AUTH_EMAIL}`)
          .expect(HttpStatus.CREATED));
    });

    describe("POST /auth/reset-password", () => {
      it("should return NOT_FOUND(404) if no token is provided", () =>
        request(httpServer).post("/auth/reset-password").expect(HttpStatus.NOT_FOUND));

      it("should return NOT_FOUND(404) if an invalid token is provided", () =>
        request(httpServer)
          .post("/auth/reset-password/invalid_token")
          .send(`password=${faker.internet.password()}`)
          .expect(HttpStatus.NOT_FOUND));

      it("should return BAD_REQUEST(400) if no password is provided", () =>
        request(httpServer)
          .post("/auth/reset-password/invalid_token")
          .expect(HttpStatus.BAD_REQUEST));

      it("fails with BAD_REQUEST(400) if the provided token is EXPIRED", async () => {
        const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
          status: EVerificationRequestStatus.EXPIRED,
          type: EVerificationRequestType.RESET_PASSWORD,
        });

        await dbService.persistAndFlush([verificationRequest]);

        await request(httpServer)
          .post(`/auth/reset-password/${verificationRequest.token}`)
          .send(`password=${faker.internet.password()}`)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it("fails with BAD_REQUEST(400) if the provided token is ACTIVE but its past its expiry date", async () => {
        const user = new UserFactory(dbService).makeOne();
        const userProfile = new UserProfileFactory(dbService).makeOne({
          role: {
            name: EUserRole.ADMIN,
          },
        });
        const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
          expiresAt: dayjs().subtract(2, "day").toDate(),
          type: EVerificationRequestType.RESET_PASSWORD,
        });

        user.userProfile = userProfile;
        userProfile.user = user;
        user.verificationRequests.add(verificationRequest);

        await dbService.persistAndFlush([verificationRequest, user, userProfile]);

        await request(httpServer)
          .post(`/auth/reset-password/${verificationRequest.token}`)
          .send(`password=${faker.internet.password()}`)
          .expect(HttpStatus.BAD_REQUEST);

        const updatedVerificationRequest = await dbService.findOne(
          VerificationRequest,
          { id: verificationRequest.id, token: verificationRequest.token },
          { disableIdentityMap: true },
        );

        expect(updatedVerificationRequest?.status).toEqual(EVerificationRequestStatus.EXPIRED);
      });

      it("fails with BAD_REQUEST(400) if the provided token is not associated with any user", async () => {
        const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
          status: EVerificationRequestStatus.ACTIVE,
          type: EVerificationRequestType.RESET_PASSWORD,
        });

        await dbService.persistAndFlush([verificationRequest]);

        await request(httpServer)
          .post(`/auth/reset-password/${verificationRequest.token}`)
          .send(`password=${faker.internet.password()}`)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it("should return with CREATED(201) if an ACTIVE token is provided", async () => {
        const email = faker.internet.email();
        const password = "password";
        const user = new UserFactory(dbService).makeOne({
          email,
          password,
        });
        const userProfile = new UserProfileFactory(dbService).makeOne({
          role: {
            name: EUserRole.ADMIN,
          },
        });
        user.userProfile = userProfile;
        userProfile.user = user;

        const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
          user,
          status: EVerificationRequestStatus.ACTIVE,
          type: EVerificationRequestType.RESET_PASSWORD,
        });

        user.verificationRequests.add(verificationRequest);
        await dbService.persistAndFlush([verificationRequest, user, userProfile]);

        const newPassword = "new_password";

        await request(httpServer)
          .post(`/auth/reset-password/${verificationRequest.token}`)
          .send(`password=${newPassword}`)
          .expect(HttpStatus.CREATED)
          .expect(({ body }) => {
            expect(body.data?.id).toEqual(user.id);
          });

        const updatedVerificationRequest = await dbService.findOne(
          VerificationRequest,
          { id: verificationRequest.id, token: verificationRequest.token },
          { disableIdentityMap: true },
        );

        expect(updatedVerificationRequest?.status).toEqual(EVerificationRequestStatus.EXPIRED);
      });

      it("should return with CREATED(201) if logged in with new password and UNAUTHORIZED(401) for old password", async () => {
        const email = faker.internet.email();
        const password = "password";
        const user = new UserFactory(dbService).makeOne({
          email,
          password,
        });
        const userProfile = new UserProfileFactory(dbService).makeOne({
          role: {
            name: EUserRole.ADMIN,
          },
        });
        user.userProfile = userProfile;
        userProfile.user = user;

        const verificationRequest = new VerificationRequestFactory(dbService).makeOne({
          user,
          status: EVerificationRequestStatus.ACTIVE,
          type: EVerificationRequestType.RESET_PASSWORD,
        });

        user.verificationRequests.add(verificationRequest);
        await dbService.persistAndFlush([verificationRequest, user, userProfile]);

        const newPassword = "new_password";

        await request(httpServer)
          .post(`/auth/reset-password/${verificationRequest.token}`)
          .send(`password=${newPassword}`)
          .expect(HttpStatus.CREATED);

        await request(httpServer)
          .post("/auth/sign-in")
          .send(`email=${email}&password=${password}`)
          .expect(HttpStatus.UNAUTHORIZED);

        await request(httpServer)
          .post("/auth/sign-in")
          .send(`email=${email}&password=${newPassword}`)
          .expect(HttpStatus.CREATED);
      });
    });

    describe("POST /auth/sign-up", () => {
      const validSignupData = {
        email: faker.internet.email(),
        password: "testPassword123",
        userProfile: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
        },
      };

      it("should return CREATED(201) with user data when registration is successful", async () => {
        vi.spyOn(cryptoHelpers, "generateSecureHex").mockReturnValue("123456");
        vi.spyOn(ConfigService.prototype, "getOrThrow").mockReturnValue("https://xyz.com");

        await request(httpServer)
          .post("/auth/sign-up")
          .send(validSignupData)
          .expect(HttpStatus.CREATED)
          .expect(({ body }) => {
            expect(body.data.email).toBe(validSignupData.email);
            expect(body.data.userProfile.firstName).toBe(validSignupData.userProfile.firstName);
            expect(body.data.userProfile.lastName).toBe(validSignupData.userProfile.lastName);
            expect(body.data.password).toBeUndefined();

            expect(mockEmailsService.sendEmailByTextOrHtml).toHaveBeenCalledWith({
              to: validSignupData.email,
              subject: "Email Verification",
              html: `Click the link to verify your email: <a href="https://xyz.com/verify?token=123456&type=${EVerificationRequestType.EMAIL_VERIFICATION}">https://xyz.com/verify?token=123456&type=${EVerificationRequestType.EMAIL_VERIFICATION}</a>`,
              text: `Click the link to verify your email: https://xyz.com/verify?token=123456&type=${EVerificationRequestType.EMAIL_VERIFICATION}`,
            });
          });

        const user = await dbService.findOneOrFail(
          User,
          { email: validSignupData.email },
          {
            disableIdentityMap: true,
          },
        );
        expect(user).toBeDefined();
      });

      it("should return BAD_REQUEST(400) when email format is invalid", () =>
        request(httpServer)
          .post("/auth/sign-up")
          .send({
            ...validSignupData,
            email: "invalid-email",
          })
          .expect(HttpStatus.BAD_REQUEST));

      it("should return BAD_REQUEST(400) when password is missing", () =>
        request(httpServer)
          .post("/auth/sign-up")
          .send({
            ...validSignupData,
            password: undefined,
          })
          .expect(HttpStatus.BAD_REQUEST));

      it("should return BAD_REQUEST(400) when user profile data is incomplete", () =>
        request(httpServer)
          .post("/auth/sign-up")
          .send({
            ...validSignupData,
            userProfile: {
              firstName: faker.person.firstName(),
            },
          })
          .expect(HttpStatus.BAD_REQUEST));

      it("should return BAD_REQUEST(400) when email already exists", async () => {
        const existingUserEmail = faker.internet.email();
        const user = new UserFactory(dbService).makeOne({
          email: existingUserEmail,
        });
        const userProfile = new UserProfileFactory(dbService).makeOne({
          role: {
            name: EUserRole.ADMIN,
          },
        });
        user.userProfile = userProfile;
        userProfile.user = user;

        await dbService.persistAndFlush([user, userProfile]);

        const existingUserSignupData = {
          email: existingUserEmail,
          password: "testPassword123",
          userProfile: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
          },
        };

        await request(httpServer)
          .post("/auth/sign-up")
          .send(existingUserSignupData)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });
});
