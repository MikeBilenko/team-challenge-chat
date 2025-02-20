import cassandra from "cassandra-driver";
const Mapper = cassandra.mapping.Mapper;

import { CassandraClient, mapper } from "./CassandraClient"

export class Reaction {
  user_ids: string[];
  reaction: string;

  constructor(reaction: string) {
    this.user_ids = [];
    this.reaction = reaction;
  }
}

export class Message {
  id: cassandra.types.Uuid;
  user_id: string;
  text: string;
  images: string[];
  responds_to_message_id: cassandra.types.Uuid | null;
  reactions: Reaction[] | null;
  chat_id: string;
  created_at: number;
  edited: boolean;
  users_read: string[] | null;

  constructor(obj: { id: cassandra.types.Uuid, 
    user_id: string, 
    text: string;
    images: string[],
    responds_to_message_id: cassandra.types.Uuid | null,
    reactions: Reaction[],
    chat_id: string,
    created_at: number,
    edited: boolean,
    users_read: string[];
  }) {
    this.id = obj.id;
    this.user_id = obj.user_id;
    this.text = obj.text;
    this.images = obj.images;
    this.responds_to_message_id = obj.responds_to_message_id;
    this.reactions = obj.reactions;
    this.chat_id = obj.chat_id;
    this.created_at = obj.created_at;
    this.edited = obj.edited;
    this.users_read = obj.users_read;
  }

  removeReaction(user_id: string) {
    if (this.reactions) {
      for (const reaction of this.reactions) {
        if (reaction.user_ids.indexOf(user_id) != -1) {
          reaction.user_ids.splice(reaction.user_ids.indexOf(user_id), 1);
        }
      }
      for (let i = 0; i < this.reactions.length; i++) {
        if (this.reactions[i].user_ids.length == 0) {
          this.reactions.splice(i, 1);
          i--;
        }
      }
    }
  }

  addReaction(user_id: string, emoji: string) {
    if (this.reactions) {
      let addedReaction = false;
      for (const reaction of this.reactions) {
        if (reaction.reaction == emoji) {
          reaction.user_ids.push(user_id);
          addedReaction = true;
        }
      }
      if (!addedReaction) {
        const reaction = new Reaction(emoji);
        reaction.user_ids.push(user_id);
        this.reactions.push(reaction);
      }
    }
  }
}

const messageMapper = mapper.forModel('Message');

export class MessageModel {
  public static async addTestMessage() {
    const messageId = cassandra.types.Uuid.random(); // Generate a random UUID for the message ID
    const userId = "test_user_id";
    const chatId = "test_chat_id";
    const reaction = new Reaction(")");
    reaction.user_ids.push(userId);

    const newMessage = new Message({
        id: messageId,
        user_id: userId,
        text: 'Hello, this is a test message!',
        images: ['image1.png', 'image2.png'],
        responds_to_message_id: null, // or another UUID if applicable
        reactions: [ reaction ],
        chat_id: chatId,
        created_at: Date.now(),
        edited: false,
        users_read: [ "test_user_id", "test_user_id" ] // autoremoves second
    });
  
    try {
        await messageMapper.insert(newMessage);
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
      const messages = res.toArray() as unknown as Message[];
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
      await messageMapper.insert(doc, docInfo, executionOptions);
    } catch (error) {
      console.error('Error inserting message:', error);
    }
  }

  public static async remove(doc: { [key: string]: any; }, 
    docInfo?: cassandra.mapping.InsertDocInfo, 
    executionOptions?: string | cassandra.mapping.MappingExecutionOptions
  ) {
    try {
      await messageMapper.remove(doc, docInfo, executionOptions);
    } catch (error) {
      console.error('Error removing message:', error);
    }
  }

  public static async update(doc: { [key: string]: any; }, 
    docInfo?: cassandra.mapping.InsertDocInfo, 
    executionOptions?: string | cassandra.mapping.MappingExecutionOptions
  ) {
    try {
      await messageMapper.update(doc, docInfo, executionOptions);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }
}