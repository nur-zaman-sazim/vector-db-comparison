import { AbstractBaseSerializer } from "@/common/serializers";

export class RolesSerializer extends AbstractBaseSerializer {
  protected serializeOneOptions = {
    skipNull: true,
    forceObject: true,
    exclude: ["permissions"],
  };

  protected serializeManyOptions = {
    skipNull: true,
    forceObject: true,
    exclude: ["permissions"],
  };
}
