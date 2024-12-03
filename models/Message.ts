import cassandra from "cassandra-driver";
const Mapper = cassandra.mapping.Mapper;

import { CassandraClient } from "./CassandraClient"

class Reaction {
  user_id: cassandra.types.Uuid;
  reaction: string;

  constructor(obj: { user_id: cassandra.types.Uuid, reaction: string }) {
    this.user_id = obj.user_id;
    this.reaction = obj.reaction;
  }
}

export class Message {
  id: cassandra.types.Uuid;
  user_id: cassandra.types.Uuid;
  text: string;
  images: string[];
  responds_to_message_id: cassandra.types.Uuid | null;
  reactions: Reaction[];
  chat_id: cassandra.types.Uuid;
  created_at: number;

  constructor(obj: { id: cassandra.types.Uuid, 
    user_id: cassandra.types.Uuid, 
    text: string;
    images: string[],
    responds_to_message_id: cassandra.types.Uuid | null,
    reactions: Reaction[],
    chat_id: cassandra.types.Uuid,
    created_at: number }) {
    this.id = obj.id;
    this.user_id = obj.user_id;
    this.text = obj.text;
    this.images = obj.images;
    this.responds_to_message_id = obj.responds_to_message_id;
    this.reactions = obj.reactions;
    this.chat_id = obj.chat_id;
    this.created_at = obj.created_at;
  }
}

const mapper = new Mapper(CassandraClient, { 
  models: { 'Message': { tables: ['messages'] } }
});

const messageMapper = mapper.forModel('Message');

export class MessageModel {
  public static async addTestMessage() {
    const chatId = cassandra.types.Uuid.fromString("653e0101-b0be-4e2c-b7ec-9aa66699902f"); // Generate a random UUID for chat ID
    const messageId = cassandra.types.Uuid.random(); // Generate a random UUID for the message ID
    const userId = cassandra.types.Uuid.random(); // Generate a random UUID for user ID
  
    const newMessage = new Message({
        id: messageId,
        user_id: userId,
        text: 'Hello, this is a test message!',
        images: ['image1.png', 'image2.png'],
        responds_to_message_id: null, // or another UUID if applicable
        reactions: [ { user_id: userId, reaction: ")" } ], // Add reactions if any
        chat_id: chatId,
        created_at: Date.now()
    });
  
    try {
        await messageMapper.insert(newMessage); // Insert the new message
        console.log('Message added successfully');
    } catch (error) {
        console.error('Error adding message:', error);
    }
  }

  public static async findOne(doc: { [key: string]: any; }, 
    docInfo?: { fields?: string[]; }, 
    executionOptions?: string | cassandra.mapping.MappingExecutionOptions
  ): Promise<Message | undefined> {
    try {
      return new Message(await messageMapper.get(doc, docInfo, executionOptions));
    } catch (error) {
      console.error('Error fetching message:', error);
      return undefined;
    }
  }

  public static async find(doc: { [key: string]: any; }, 
    docInfo?: cassandra.mapping.FindDocInfo | undefined, 
    executionOptions?: string | cassandra.mapping.MappingExecutionOptions | undefined
  ): Promise<Message[]> {
    try {
      const res = await messageMapper.find(doc, docInfo, executionOptions);
      const messages = res as unknown as Message[];
      return messages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
  }

  public static async insert(doc: Message, 
    docInfo?: cassandra.mapping.InsertDocInfo, 
    executionOptions?: string | cassandra.mapping.MappingExecutionOptions
  ) {
    try {
      messageMapper.insert(doc, docInfo, executionOptions);
    } catch (error) {
      console.error('Error inserting message:', error);
    }
  }
}