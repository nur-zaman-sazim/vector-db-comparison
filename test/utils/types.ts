import type { bootstrapTestServer } from "./bootstrap";

export type THttpServer = Awaited<ReturnType<typeof bootstrapTestServer>>["httpServerInstance"];
