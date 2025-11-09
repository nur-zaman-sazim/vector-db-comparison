import type { Socket } from "socket.io";

export type TSocketEventMap = {
  [event: string]: (...args: unknown[]) => void;
};

export type TSocket = Socket<TSocketEventMap, TSocketEventMap, TSocketEventMap, unknown> & {
  userId?: number;
};
