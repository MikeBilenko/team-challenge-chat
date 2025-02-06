import { DefaultEventsMap, Socket } from "socket.io";
import { createMessage, getMessageById, getMessagesBeforeDate, removeMessageById, updateMessage } from "../services/messageServices";
import { getChats, userIsInChat, userIsModeratorInChat } from "../backend_api/chat_api";
import { uploadToCloudinary } from "../services/cloudinary";
import { getUser } from "../backend_api/user_api";
import { Catch, CatchAsync } from "../middlewares/Catch";

export class SocketEventHandler {
  constructor(public socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {}

  @Catch
  ping(callback: Function) {
    console.log("ping");
    this.socket.broadcast.emit("pong");
    if (callback instanceof Function) {
      callback();
    }
    throw new Error("new error in ping");
  }

  @CatchAsync
  async chatMessage(token: string, incomingMessageObject: any, callback: Function) {
    const messageText = incomingMessageObject.message;
    const user = await userIsInChat(token, incomingMessageObject.chat_id);
    if (user.message) {
      throw new Error(user.message);
    }
    const user_id = user._id;
    const chat_id = incomingMessageObject.chat_id;

    let images: string[] = [];
    if (incomingMessageObject.images) {
      try {
        for (let i = 0; incomingMessageObject.images[i]; i++) {
          let file = incomingMessageObject.images[i];
          images.push(await uploadToCloudinary(file));
        }
      } catch (error) {
        console.log(error);
        if (typeof(callback) == "function") {
          callback(error);
        }
      }
    }

    let messageObject = (await createMessage({
      user_id: user_id, 
      text: messageText,
      images: images, // TODO: add images
      responds_to_message_id: incomingMessageObject.responds_to_message_id,
      reactions: [],
      chat_id: chat_id,
    }));
    const name = user.name;
    const profilePicture = user.avatar || "https://res.cloudinary.com/dtonpxhk7/image/upload/v1727784788/fvqcrnaneokovnfwcgya.jpg";    
    const outgoingMessage = { name, profilePicture, ...messageObject }
    this.socket.to(messageObject.chat_id.toString()).emit("chat message", outgoingMessage);
    if (typeof(callback) == "function") {
      callback(messageObject);
    }
  }

  @CatchAsync
  async setChatRooms (token: any, callback: Function) {
    if (token instanceof String) {
      throw new Error("No token");
    } else {
      const chats = await getChats(token);   
      if (chats.length) {
        for (const chat of chats) {
          this.socket.join(chat._id);
        }
      } else {
        // throw new Error("No chats returned from backend service");
      }
      if (callback instanceof Function) {
        callback(chats);
      }
    }
  }

  @CatchAsync
  async getMessagesBefore(token: any, chat_id: string, date: Date, callback: Function) {
    if (typeof token != "string") {
      throw new Error("No token");
    } else {
      const user = await userIsInChat(token, chat_id);
      if (user) {
        const messages = await getMessagesBeforeDate(chat_id, date);
        callback(messages);
      }
    }
  }

  @CatchAsync
  async deleteChatMessage(token: string, incomingMessageObject: any, callback: Function) {
    const message = await getMessageById(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
    
    if (typeof(message) == "undefined") {
      if (callback instanceof Function) {
        callback("Error: No such message");
      }
      return;
    }

    const user = await getUser(token);
    const isModeratorResponse = await userIsModeratorInChat(token, message.chat_id);    
    const isModerator = isModeratorResponse != null && isModeratorResponse.message == null;
    
    if (user._id != message.user_id && !isModerator) {
      if (callback) {
        callback("Error: User does not have permission to delete this message");
      }
      return;
    }

    await removeMessageById(message.chat_id, message.id, message.created_at);
    this.socket.to(message!.chat_id.toString()).emit("delete chat message", message!.id);

    if (callback instanceof Function) {
      callback(message);
    }
  }

  @CatchAsync
  async updateChatMessage(token: string, incomingMessageObject: any, callback: Function) {
    const message = await getMessageById(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
    
    if (typeof(message) == "undefined") {
      if (callback) {
        callback("Error: No such message");
      }
      return;
    }

    const user = await getUser(token);

    if (user._id != message.user_id) {
      if (callback) {
        callback("Error: User does not have permission to update this message");
      }
      return;
    }
    
    await updateMessage(incomingMessageObject);
    
    this.socket.to(message!.chat_id.toString()).emit("update chat message", message);

    if (typeof(callback) == "function") {
      callback(message);
    }
  }

  pingEventListener(socket: any) {
    return this.ping.bind({ socket });
  }

  subscribe(): void {
    this.socket.on('ping', this.ping.bind(this));
    this.socket.on("chat message", this.chatMessage.bind(this));
    this.socket.on("set chat rooms", this.setChatRooms.bind(this));
    this.socket.on("get messages before", this.getMessagesBefore.bind(this));
    this.socket.on("delete chat message", this.deleteChatMessage.bind(this));
    this.socket.on("update chat message", this.updateChatMessage.bind(this));
  }

  unsubscrube() {
    throw new Error("Method not implemented");
  }
}
