export async function getChats(token: string) : Promise<Array<any>> {
  const url = new URL("/chatRooms", process.env.BACKEND_URL as string).href;  
  const headers = new Headers();  
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}

export async function userIsInChat(token: string, chat_id: string) : Promise<any> {
  const url = new URL("/chatRooms" + "/" + chat_id, process.env.BACKEND_URL as string).href;  
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}