import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { Observable } from "rxjs";

import { PassportGoogleOAuthError } from "@/common/errors/passport-google-oauth.error";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const canActivateResult = super.canActivate(context);

    if (canActivateResult instanceof Promise) {
      return canActivateResult.catch((error: PassportGoogleOAuthError) => {
        throw new UnauthorizedException(`${error.message}: ${error.code}`);
      });
    } else {
      return canActivateResult;
    }
  }
}
