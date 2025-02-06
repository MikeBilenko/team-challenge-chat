export function Catch(target: Function, context: any) {
  return function (this: any, ..._args: any[]) {
    try {
      target.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}

export function CatchAsync(target: (this: any, ..._: any[]) => Promise<any>) {
  return async function (this: any, ..._args: any[]) {
    try {
      await target.call(this, ..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}