import "reflect-metadata";
import { SocketEventHandler } from "../controllers/chatWebSocketControllers";
const validateMetadataKey = Symbol("validate");

type ValidateMetadata = { parameterIndex: number, validators: Function[] };

export function val(...validators: Function[]) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    let existingRequiredParameters: ValidateMetadata[] = Reflect.getOwnMetadata(validateMetadataKey, target, propertyKey) || [];
    existingRequiredParameters.push( { parameterIndex, validators });
    Reflect.defineMetadata(validateMetadataKey, existingRequiredParameters, target, propertyKey);
  }
}

export function Validate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<(...agrs: any[]) => any>) : TypedPropertyDescriptor<(...agrs: any[]) => any> {
  let method = descriptor.value!;
 
  function decorator(this: any, ...args: any[]) {
    let validateMetadata: ValidateMetadata[] = Reflect.getOwnMetadata(validateMetadataKey, target, propertyName);
    if (validateMetadata) {
      for (const { parameterIndex, validators } of validateMetadata) {
        // if (parameterIndex >= arguments.length || arguments[parameterIndex] === undefined) {
        //   throw new Error("Missing required argument.");
        // }
        for (const validate of validators) {
          const result = validate(arguments[parameterIndex]);
          if (result && result.error) {
            console.log(result.error);
            throw new Error(`In ${propertyName} parameter #${parameterIndex} failed validation '${validate.name}'`);
          }
        }
      }
      return method.apply(this, arguments as unknown as any[])
    }
  };

  return { value: decorator };
}