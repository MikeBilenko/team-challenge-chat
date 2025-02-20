export function validateToken(value: any) {
  if (typeof value === "string") {
    return;
  } else {
    return { error: 'Token is not a string.' }
  }
}