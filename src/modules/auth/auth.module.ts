import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { RolesModule } from "@/modules/roles/roles.module";
import { UsersModule } from "@/modules/users/users.module";

import { EmailsModule } from "../emails/emails.module";
import { VerificationRequestsModule } from "../verification-requests/verification-requests.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_TOKEN_LIFETIME,
      },
    }),
    UsersModule,
    RolesModule,
    VerificationRequestsModule,
    EmailsModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
