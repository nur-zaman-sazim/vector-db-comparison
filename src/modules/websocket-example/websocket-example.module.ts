import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { WebsocketExampleGateway } from "./websocket-example.gateway";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_TOKEN_LIFETIME,
      },
    }),
  ],
  providers: [WebsocketExampleGateway],
})
export class WebsocketExampleModule {}
