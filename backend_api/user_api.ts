export async function getUser(token: string) : Promise<any> {
  const url = new URL("/auth/current", process.env.BACKEND_URL as string).href;  
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });  
  return res.json();
}