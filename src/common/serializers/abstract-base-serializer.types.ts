export type TSerializationOptions = {
  skipNull?: boolean;
  forceObject?: boolean;
  exclude?: string[];
  populate?: string[];
  ignoreSerializers?: boolean;
};
