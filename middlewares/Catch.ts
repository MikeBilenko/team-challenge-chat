import { SocketEventHandler } from "../controllers/chatWebSocketControllers";

export function Catch(
  this: void,
  target: SocketEventHandler, 
  propertyName: string, 
  descriptor: TypedPropertyDescriptor<(...agrs: any[]) => any>
) : TypedPropertyDescriptor<(...agrs: any[]) => any> {
  let method = descriptor.value!;
  function decorator(this: SocketEventHandler, ..._args: any[]) {
    try {
      method.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
  return { value: decorator };
}

export function CatchAsync(
  this: void,
  target: SocketEventHandler,
  propertyName: string, 
  descriptor: TypedPropertyDescriptor<(...agrs: any[]) => any>
) : TypedPropertyDescriptor<(...agrs: any[]) => any> {
  let method = descriptor.value!;
  async function decorator(this: SocketEventHandler, ..._args: any[]) {
    try {
      await method.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
  return { value: decorator };
}