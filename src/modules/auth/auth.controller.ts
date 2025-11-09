import { Body, Controller, Param, Post, UseGuards, UseInterceptors } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { SelfRegisterUserDto, UserResponse } from "../users/users.dtos";
import { UsersSerializer } from "../users/users.serializer";
import { UsersService } from "../users/users.service";
import { FORGOT_PASSWORD_EMAIL_SENT_MESSAGE } from "./auth.constants";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendForgotPasswordEmailResponse,
  SignInResponse,
} from "./auth.dtos";
import { makeTokenizedUser } from "./auth.helpers";
import { IGoogleOnlineUser } from "./auth.interfaces";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { GoogleIdTokenGuard } from "./guards/google-id-token.guard";
import { GoogleOAuthGuard } from "./guards/google-oauth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";

@Controller("auth")
@UseInterceptors(ResponseTransformInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly usersSerializer: UsersSerializer,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post("sign-in")
  async signIn(@CurrentUser() user: User): Promise<SignInResponse> {
    const accessToken = await this.authService.createAccessToken(user);

    return {
      accessToken,
      user: makeTokenizedUser(user),
    };
  }

  @Post("google/sign-in")
  @UseGuards(GoogleOAuthGuard)
  async signInWithGoogle(@CurrentUser() googleUser: IGoogleOnlineUser): Promise<SignInResponse> {
    const user = await this.authService.signInWithGoogle({
      user: googleUser,
      roleName: EUserRole.ADMIN,
    });

    const accessToken = await this.authService.createAccessToken(user);

    return {
      accessToken,
      user: makeTokenizedUser(user),
    };
  }

  @Post("google/token/sign-in")
  @UseGuards(GoogleIdTokenGuard)
  async signInWithGoogleToken(
    @CurrentUser() googleUser: IGoogleOnlineUser,
  ): Promise<SignInResponse> {
    const user = await this.authService.signInWithGoogle({
      user: googleUser,
      roleName: EUserRole.ADMIN,
    });

    const accessToken = await this.authService.createAccessToken(user);

    return {
      accessToken,
      user: makeTokenizedUser(user),
    };
  }

  @Post("sign-up")
  async signUp(@Body() selfRegisterUserDto: SelfRegisterUserDto): Promise<UserResponse> {
    const newUser = await this.usersService.selfRegister(selfRegisterUserDto);

    return this.usersSerializer.serialize(newUser);
  }

  @Post("forgot-password")
  async sendForgotPasswordEmail(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SendForgotPasswordEmailResponse> {
    await this.authService.sendForgotPasswordEmail(forgotPasswordDto.email);

    return { message: FORGOT_PASSWORD_EMAIL_SENT_MESSAGE };
  }

  @Post("reset-password/:token")
  async resetPasswordByToken(
    @Param("token") token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    const user = await this.authService.resetPasswordByToken(token, resetPasswordDto.password);

    return this.usersSerializer.serialize<User, UserResponse>(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    const updatedUser = await this.authService.changePassword(user.id, changePasswordDto);

    return this.usersSerializer.serialize(updatedUser);
  }
}
