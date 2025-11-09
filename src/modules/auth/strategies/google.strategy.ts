import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";

import {
  Strategy,
  VerifyCallback,
  Profile,
  GoogleCallbackParameters,
} from "passport-google-oauth20";

import { IGoogleOnlineUser } from "../auth.interfaces";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly configService: ConfigService) {
    super(
      {
        clientID: configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
        clientSecret: configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
        callbackURL: `${configService.getOrThrow<string>(
          "WEB_CLIENT_BASE_URL",
        )}/auth/google/callback`,
        scope: ["email", "profile"],
        type: "online",
      },
      (
        accessToken: string,
        refreshToken: string,
        params: GoogleCallbackParameters,
        profile: Profile,
        done: VerifyCallback,
      ) => this.validate(accessToken, refreshToken, params, profile, done),
    );
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    params: GoogleCallbackParameters,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { name, emails, id } = profile;

    if (!emails?.[0].value || !name?.givenName || !name?.familyName || !id) {
      return done(new Error("Invalid Google profile"), undefined);
    }

    const user: IGoogleOnlineUser = {
      email: emails[0].value,
      isVerified: emails[0].verified,
      firstName: name.givenName,
      lastName: name.familyName,
      sub: id,
      accessToken,
      scope: params.scope,
      tokenType: params.token_type,
    };

    done(null, user);
  }
}
