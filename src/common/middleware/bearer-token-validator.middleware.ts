import { UnauthorizedException } from "@nestjs/common";

export default function extractBearerAuthTokenFromHeaders(headers: Record<string, string>) {
  const bearerToken = headers?.authorization?.split(" ");

  if (!bearerToken || bearerToken[0] !== "Bearer" || !bearerToken[1]) {
    throw new UnauthorizedException();
  }

  const token = bearerToken[1];

  return token;
}
