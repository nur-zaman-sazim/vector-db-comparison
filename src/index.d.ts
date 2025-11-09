import { IEnvironmentVariables } from "./common/interfaces/environment-variables.interface";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends IEnvironmentVariables {
      NODE_ENV: "development" | "production" | "test" | "local";
    }
  }
}
