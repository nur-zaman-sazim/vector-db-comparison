import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function OneButNotTheOther(
  propertyOne: string,
  propertyTwo: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "oneButNotTheOther",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [propertyOne, propertyTwo],
      options: validationOptions,
      validator: {
        validate(_value, args: ValidationArguments) {
          const [relatedPropertyName1, relatedPropertyName2] = args.constraints;
          const relatedValue1 = (args.object as never)[relatedPropertyName1];
          const relatedValue2 = (args.object as never)[relatedPropertyName2];
          return (relatedValue1 && !relatedValue2) || (!relatedValue1 && relatedValue2);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName1, relatedPropertyName2] = args.constraints;
          return `Only one of ${relatedPropertyName1} or ${relatedPropertyName2} should be defined.`;
        },
      },
    });
  };
}
