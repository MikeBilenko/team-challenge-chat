export function validateCallback(value: any) {
  if (!value || typeof value === "function") {
    return;
  } else {
    return { error: 'Callback recieved but it is not a function.' }
  }
}