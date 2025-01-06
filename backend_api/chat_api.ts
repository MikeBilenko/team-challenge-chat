export async function getChats(token: string) : Promise<Array<any>> {
  const url = new URL("/chatRooms", process.env.BACKEND_URL as string).href;  
  const headers = new Headers();  
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}