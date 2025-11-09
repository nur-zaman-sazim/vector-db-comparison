export const isLocal = (stageEnv: string | undefined) =>
  stageEnv === "local" || stageEnv === "" || !stageEnv;
