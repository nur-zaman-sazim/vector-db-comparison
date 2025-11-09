import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { EntityManager } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { User } from "@/common/entities/users.entity";
import { EOAuthProvider } from "@/common/enums/shared.enums";
import {
  EVerificationRequestStatus,
  EVerificationRequestType,
} from "@/common/enums/verification-requests.enums";
import { RolesService } from "@/modules/roles/roles.service";
import { UsersService } from "@/modules/users/users.service";

import { IEmailService } from "../emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "../emails/emails.constants";
import { VerificationRequestsService } from "../verification-requests/verification-requests.service";
import {
  INVALID_USER_CREDENTIALS,
  RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES,
} from "./auth.constants";
import { ChangePasswordDto } from "./auth.dtos";
import { IJwtPayload, ISignInWithGoogleParams } from "./auth.interfaces";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly verificationRequestsService: VerificationRequestsService,
    private readonly configService: ConfigService,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailsService: IEmailService,
    private readonly em: EntityManager,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailOrThrow(email);

    const verified = await argon2.verify(user.password as string, password, ARGON2_OPTIONS);
    if (!verified) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    if (!user.userProfile) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    return user;
  }

  checkUserExists(id: number) {
    return this.usersService.findByIdOrThrow(id);
  }

  checkUserClaimByRole(claimId: number) {
    return this.rolesService.findByIdOrThrow(claimId);
  }

  async createAccessToken(loggedInUser: User): Promise<string> {
    const user = await this.usersService.findByEmailOrThrow(loggedInUser.email);

    if (!user.userProfile) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      claimId: user.userProfile.role.id,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async sendForgotPasswordEmail(email: string) {
    const user = await this.usersService.findByEmailOrThrow(email);

    const resetPasswordVerificationRequest =
      await this.verificationRequestsService.getVerificationRequest(
        user,
        EVerificationRequestType.RESET_PASSWORD,
        RESET_PASSWORD_TOKEN_EXPIRATION_DURATION_IN_MINUTES,
      );

    const resetPasswordLink = new URL(
      `/reset-password?token=${resetPasswordVerificationRequest.token}`,
      this.configService.getOrThrow("WEB_CLIENT_BASE_URL"),
    );

    return this.emailsService.sendEmailByTextOrHtml({
      to: user.email,
      subject: "Reset Password",
      text: `Click the link to reset your password: ${resetPasswordLink}`,
      html: `Click the link to reset your password: <a href="${resetPasswordLink}">${resetPasswordLink}</a>`,
    });
  }

  async resetPasswordByToken(token: string, newPassword: string) {
    const verificationRequest =
      await this.verificationRequestsService.findOneOrFailVerificationRequest(
        token,
        EVerificationRequestType.RESET_PASSWORD,
      );

    if (!verificationRequest.user) throw new NotFoundException("Invalid Token, Please try again");

    verificationRequest.status = EVerificationRequestStatus.EXPIRED;

    const updatedUser = await this.usersService.updatePassword(
      verificationRequest.user.id,
      newPassword,
      verificationRequest.user.userProfile.role,
    );

    await this.em.flush();

    return updatedUser;
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findByIdOrThrow(userId);

    const verified = await argon2.verify(
      user.password as string,
      changePasswordDto.currentPassword,
      ARGON2_OPTIONS,
    );
    if (!verified) throw new UnauthorizedException(INVALID_USER_CREDENTIALS);

    const updatedUser = await this.usersService.updatePassword(
      user.id,
      changePasswordDto.newPassword,
      user.userProfile.role,
    );

    await this.em.flush();

    return updatedUser;
  }

  async signInWithGoogle(input: ISignInWithGoogleParams) {
    const existingUser = await this.usersService.findByEmail(input.user.email);

    if (!existingUser) {
      return this.usersService.createWithOAuthProvider(input, EOAuthProvider.GOOGLE);
    }

    if (existingUser.password) {
      throw new UnauthorizedException("User already signed up with email and password");
    }

    return existingUser;
  }
}
