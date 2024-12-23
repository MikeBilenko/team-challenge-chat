import cassandra from "cassandra-driver";

import { Message, MessageModel, Reaction } from "../models/Message";


export async function createMessage(messageObj: {
  user_id: cassandra.types.Uuid;
  text: string;
  images: string[];
  responds_to_message_id: cassandra.types.Uuid | null;
  reactions: Reaction[];
  chat_id: cassandra.types.Uuid;
}) : Promise<Message> {
  const message = new Message({
    id: cassandra.types.Uuid.random(),
    created_at: Date.now(),
    ...messageObj
  })
  await MessageModel.insert(message);
  return message;
}