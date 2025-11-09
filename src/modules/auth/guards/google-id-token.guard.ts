import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { OAuth2Client } from "google-auth-library";

import extractBearerAuthTokenFromHeaders from "@/common/middleware/bearer-token-validator.middleware";

import { IGoogleOnlineUser } from "../auth.interfaces";

@Injectable()
export class GoogleIdTokenGuard implements CanActivate {
  private readonly client: OAuth2Client;
  private readonly configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
    this.client = new OAuth2Client(this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID"));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];
    const accessToken = request.headers["x-google-access-token"];

    if (!authHeader || !accessToken) {
      throw new UnauthorizedException("Authorization header or Access token is missing");
    }

    const idToken = extractBearerAuthTokenFromHeaders(request.headers);
    if (!idToken) {
      throw new UnauthorizedException("Token is missing");
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email_verified) {
        throw new UnauthorizedException("Email not verified");
      }

      const googleUser: IGoogleOnlineUser = {
        email: payload.email!,
        isVerified: true,
        firstName: payload.given_name!,
        lastName: payload.family_name ?? "",
        sub: payload.sub,
        scope: "email profile",
        tokenType: "Bearer",
        accessToken: accessToken,
      };
      request.user = googleUser;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid Google access token");
    }
  }
}
