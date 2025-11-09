import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { WebSocketServer } from "@nestjs/websockets";

import type { Server } from "socket.io";

import { TSocket } from "./abstract-websocket.types";

@Injectable()
export abstract class AbstractWebsocketGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer() protected readonly server!: Server;

  onModuleInit() {
    this.server.on("connection", (socket) => this.processNewConnection(socket));
  }

  onModuleDestroy() {
    this.server.close();
  }

  abstract processNewConnection(socket: TSocket): void;

  abstract emitPayloadToRoom<TPayload>(room: string, event: string, payload: TPayload): void;

  abstract emitPayloadForEvent<TPayload>(event: string, payload: TPayload): void;
}
