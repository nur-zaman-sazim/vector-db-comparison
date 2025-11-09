import { INestApplication } from "@nestjs/common";

import { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import { io, Socket } from "socket.io-client";
import { DoneCallback } from "vitest";

import {
  EGatewayIncomingEvent,
  EGatewayOutgoingEvent,
} from "@/modules/websocket-example/websocket-example.enum";

import { seedPermissionsData } from "../auth/auth.helpers";
import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getAccessToken } from "../utils/helpers/access-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";

describe("Websocket Example Gateway (E2E", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;
  let socket: Socket;

  const testUserEmail = faker.internet.email();
  const testUserPassword = faker.internet.password();
  let token: string;

  const defaultSocketConnectConfig = {
    autoConnect: false,
    path: "/ws-example",
    transports: ["websocket"],
  };
  const defaultSocketUrl = `ws://localhost:${process.env.BE_WS_PORT}`;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);

    await createUserInDb(dbService, {
      email: testUserEmail,
      password: testUserPassword,
    });

    token = await getAccessToken(httpServer, testUserEmail, testUserPassword);

    await appInstance.listen(5000);
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  afterEach(() => {
    dbService.clear();
    if (socket) {
      socket.disconnect();
    }
  });

  describe("unauthenticated user", () => {
    it("unauthenticated users cannot connect", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          authorization: `Bearer ${token.slice(1)}`,
        },
        extraHeaders: {
          authorization: `Bearer ${token.slice(1)}`,
        },
      });

      socket.on("connect_error", (error) => {
        expect(error.message).toBe("Unauthorized");
        done();
      });

      socket.connect();
    });
  });

  describe("authenticated user", () => {
    it("authenticated users can connect", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          authorization: `Bearer ${token}`,
        },
        extraHeaders: {
          authorization: `Bearer ${token}`,
        },
      });

      socket.on("connect", () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.connect();
    });
  });

  describe("ping event", () => {
    it("responds to ping event", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          authorization: `Bearer ${token}`,
        },
        extraHeaders: {
          authorization: `Bearer ${token}`,
        },
      });

      socket.on("connect", () => {
        socket.emit(EGatewayIncomingEvent.PING, { data: "ping" });
        socket.on(EGatewayOutgoingEvent.PONG, (payload) => {
          expect(payload).toEqual({ data: "ping" });
          done();
        });
      });

      socket.connect();
    });
  });
});
