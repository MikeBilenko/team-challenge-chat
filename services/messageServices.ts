import cassandra from "cassandra-driver";
const q = cassandra.mapping.q;

import { Message, MessageModel, Reaction } from "../models/Message";


export async function createMessage(messageObj: {
  user_id: string;
  text: string;
  images: string[];
  responds_to_message_id: cassandra.types.Uuid | null;
  reactions: Reaction[];
  chat_id: string;
}) : Promise<Message> {
  const message = new Message({
    id: cassandra.types.Uuid.random(),
    created_at: Date.now(),
    ...messageObj
  })
  await MessageModel.insert(message);
  return message;
}

export function getMessagesBeforeDate(chat_id: string, date: Date) : Promise<Message[]> {
  return MessageModel.find({chat_id, created_at: q.lte(date)});
}