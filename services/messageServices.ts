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
  return MessageModel.find({chat_id, created_at: q.lte(date)}, undefined, { fetchSize: 20 });
}

export function getMessageById(chat_id: string, message_id: cassandra.types.Uuid, created_at: number) : Promise<Message | undefined> {
  return MessageModel.findOne({chat_id, id: message_id, created_at});
}

export function removeMessageById(chat_id: string, message_id: cassandra.types.Uuid, created_at: number) : Promise<void> {
  return MessageModel.remove({chat_id, id: message_id, created_at});
}