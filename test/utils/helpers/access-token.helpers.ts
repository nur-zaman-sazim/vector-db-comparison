import { HttpStatus } from "@nestjs/common";

import request from "supertest";

import { MOCK_AUTH_EMAIL, MOCK_AUTH_PASS } from "../../auth/auth.mock";
import { bootstrapTestServer } from "../bootstrap";

export async function getAccessToken(
  httpServer: Awaited<ReturnType<typeof bootstrapTestServer>>["httpServerInstance"],
  email = MOCK_AUTH_EMAIL,
  password = MOCK_AUTH_PASS,
) {
  const { body } = await request(httpServer)
    .post("/auth/sign-in")
    .send({ email, password })
    .expect(HttpStatus.CREATED);

  return body.data.accessToken;
}
