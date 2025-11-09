import { Type } from "@nestjs/common";
import {
  MappedType,
  PartialType,
  applyIsOptionalDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from "@nestjs/mapped-types";
import { RemoveFieldsWithType } from "@nestjs/mapped-types/dist/types/remove-fields-with-type.type";

import { Type as CTType } from "class-transformer";

import { DeepPartial } from "../../types/deep-partial.type";

export function DeepPartialType<T>(classRef: Type<T>) {
  abstract class DeepPartialClassType {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }

  const propertyKeys = inheritValidationMetadata(classRef, DeepPartialClassType);
  inheritTransformationMetadata(classRef, DeepPartialClassType);

  if (propertyKeys) {
    propertyKeys.forEach((key) => {
      applyIsOptionalDecorator(DeepPartialClassType, key);
      CTType(() => PartialType(classRef))(DeepPartialClassType.prototype, key);
    });
  }

  Object.defineProperty(DeepPartialClassType, "name", {
    value: `DeepPartial${classRef.name}`,
  });

  return DeepPartialClassType as MappedType<
    // eslint-disable-next-line @typescript-eslint/ban-types
    RemoveFieldsWithType<DeepPartial<T>, Function>
  >;
}
