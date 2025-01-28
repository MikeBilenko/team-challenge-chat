export function Catch(target: Function) {
  return function (..._args: any[]) {
    try {
      target(..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}

export function CatchAsync(target: (..._args: any[]) => Promise<any>) {
  return async function (..._args: any[]) {
    try {
      await target(..._args);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message, '\n', error.stack);
      }
    }
  };
}