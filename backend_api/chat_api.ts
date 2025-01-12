export async function getChats(token: string) : Promise<Array<any>> {
  const url = new URL("/chat_rooms", process.env.BACKEND_URL as string).href;  
  const headers = new Headers();  
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}

export async function userIsInChat(token: string, chat_id: string) : Promise<any> {
  const url = new URL("/chat_rooms" + "/" + chat_id, process.env.BACKEND_URL as string).href;  
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}

export async function userIsModeratorInChat(token: string, chat_id: string) : Promise<any> {
  const url = new URL("/chat_rooms/is_moderaror" + "/" + chat_id, process.env.BACKEND_URL as string).href;  
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  const res = await fetch(url, { headers });
  return res.json();
}