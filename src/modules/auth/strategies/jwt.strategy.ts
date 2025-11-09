import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt, Strategy } from "passport-jwt";

import { User } from "@/common/entities/users.entity";
import { IJwtPayload } from "@/modules/auth/auth.interfaces";

import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: IJwtPayload): Promise<User> {
    const user = await this.authService.checkUserExists(payload.sub);
    const userClaim = await this.authService.checkUserClaimByRole(payload.claimId);

    if (!("userProfile" in user && user.userProfile))
      throw new UnauthorizedException("User profile not found");

    if (!(user.userProfile.role.id === userClaim.id))
      throw new UnauthorizedException("User claim mismatch");

    return user;
  }
}
