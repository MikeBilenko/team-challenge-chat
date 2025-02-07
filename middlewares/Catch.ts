import { SocketEventHandler } from "../controllers/chatWebSocketControllers";

export function Catch(target: Function) {
  return function (this: SocketEventHandler, ..._args: any[]) {
    try {
      target.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}

export function CatchAsync(target: (this: SocketEventHandler, ..._: any[]) => Promise<any>) {
  return async function (this: SocketEventHandler, ..._args: any[]) {
    try {
      await target.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}