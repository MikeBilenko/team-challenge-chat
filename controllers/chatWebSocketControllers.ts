import { DefaultEventsMap, Socket } from "socket.io";
import { addReactionToMessage, createMessage, getMessage, getMessagesBeforeDate, readMessage, removeMessageById, updateMessage } from "../services/messageServices";
import { getChats, userIsInChat, userIsModeratorInChat } from "../backend_api/chat_api";
import { uploadToCloudinary } from "../services/cloudinary";
import { getUser } from "../backend_api/user_api";
import { Catch, CatchAsync } from "../middlewares/Catch";
import { getOnlineStatus, setOnlineStatus } from "../services/onlineStatusServices";
import { val, Validate } from "../middlewares/Validate";
import { validateToken } from "../schemas/validateToken";
import { validateCallback } from "../schemas/validateCallback";
import { deleteMessageSchema, incomingMessageSchema, readMessageSchema, updateMessageSchema } from "../schemas/messageSchemas";
import { Message } from "../models/Message";
import { PossibleReactions } from "../helpers/PossibleReactions";

export class SocketEventHandler {
  constructor(
    public socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    private token?: string | undefined,
    private chatIDs?: string[] | undefined
  ) {}

  @Catch
  @Validate
  ping(@val(validateCallback) callback: Function | undefined) {
    console.log("ping");
    this.socket.broadcast.emit("pong");
    if (callback) {
      callback();
    }
  }

  @CatchAsync
  @Validate
  async chatMessage(
    @val(validateToken) token: string,
    @val(incomingMessageSchema.validate.bind(incomingMessageSchema)) incomingMessageObject: any,
    @val(validateCallback) callback: Function | undefined
  ) {
    const messageText = incomingMessageObject.text;
    const user = await userIsInChat(token, incomingMessageObject.chat_id);
    if (user.message) {
      throw new Error(user.message);
    }
    const user_id = user._id;
    const chat_id = incomingMessageObject.chat_id;

    let images: string[] = [];
    if (incomingMessageObject.images) {
      try {
        // TODO: rework this for an array maybe?
        for (let i = 0; incomingMessageObject.images[i] && i < 10; i++) {
          let file = incomingMessageObject.images[i];
          images.push(await uploadToCloudinary(file));
        }
      } catch (error) {
        console.log(error);
        if (callback) {
          callback(error);
        }
      }
    }

    let messageObject = (await createMessage({
      user_id: user_id, 
      text: messageText,
      images: images,
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
  @Validate
  async setChatRoomsAndOnline(
    @val(validateToken) token: string, 
    @val(validateCallback) callback: Function | undefined
  ) {
    this.token = token;
    const user = await getUser(token);   
    const chats = await getChats(token);
    this.chatIDs = [];
    for (const chat of chats) {
      this.socket.join(chat._id);
      this.chatIDs.push(chat._id);
      this.socket.in(chat._id).emit("user online", user._id);
    }
    setOnlineStatus(user._id, true);
    if (callback) {
      for (const chat of chats) {
        chat.onlineUsers = [];
        for (const userID of chat.users) {
          if (await getOnlineStatus(userID)) {
            chat.onlineUsers.push(userID);
          }
        }
      }
      callback(chats);
    }
  }

  @CatchAsync
  @Validate
  async getMessagesBefore(
    @val(validateToken) token: any,
    chat_id: string,
    date: Date,
    @val(validateCallback) callback: Function | undefined
  ) {
    const user = await userIsInChat(token, chat_id);
    if (user) {
      const messages = await getMessagesBeforeDate(chat_id, date);
      if (callback) {
        callback(messages);
      }
    }
  }

  @CatchAsync
  @Validate
  async deleteChatMessage(
    @val(validateToken) token: string,
    @val(deleteMessageSchema.validate.bind(deleteMessageSchema)) incomingMessageObject: any,
    @val(validateCallback) callback: Function | undefined
  ) {
    const message = await getMessage(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
    
    if (typeof(message) == "undefined") {
      if (callback) {
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

    // TODO remove connected images
    await removeMessageById(message.chat_id, message.id, message.created_at);
    this.socket.to(message!.chat_id.toString()).emit("delete chat message", message!.id);

    if (callback) {
      callback(message);
    }
  }

  @CatchAsync
  @Validate
  async updateChatMessage(
    @val(validateToken) token: string,
    @val(updateMessageSchema.validate.bind(updateMessageSchema)) incomingMessageObject: any,
    @val(validateCallback) callback: Function | undefined
  ) {
    const message = await getMessage(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
    
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
    
    let images: string[] = [];
    if (incomingMessageObject.images) {
      try {
        for (let i = 0; incomingMessageObject.images[i] && i < 10; i++) {
          let file = incomingMessageObject.images[i];
          images.push(await uploadToCloudinary(file));
        }
      } catch (error) {
        console.log(error);
        if (callback) {
          callback(error);
        }
      }
    }

    const newMessage = typeof(incomingMessageObject.images) == "undefined" ? 
      { ...message, ...incomingMessageObject }:
      { ...message, ...incomingMessageObject, images };

    await updateMessage( newMessage );

    this.socket.to(message!.chat_id.toString()).emit("update chat message", newMessage);

    if (callback) {
      callback(newMessage);
    }
  }

  @CatchAsync
  @Validate
  async writing(@val(validateToken) token: any, chatID: any) {
    const user = await getUser(token);
    this.socket.volatile.in(chatID).emit("writing", user._id, chatID);
  }

  @CatchAsync
  async disconnecting() {
    if (!this.token) {
      console.log("disconnecting user was not authorized");
      return;
    }
    const user = await getUser(this.token);
    if (!user._id) {
      return;
    }
    await setOnlineStatus(user._id, false);
    if (!this.chatIDs) {
      return;
    }
    for (const chat of this.chatIDs) {
      this.socket.in(chat).emit("user offline", user._id);
    }
  }

  @CatchAsync
  @Validate
  async getUnreadMessages(
    @val(validateToken) token: any,
    chat_id: string,
    @val(validateCallback) callback: Function | undefined
  ) {
    const amountPerFetch = 50; // 2 at minimum!
    const user = await userIsInChat(token, chat_id);
    if (user && user._id) {
      const userID = user._id;
      const messages: Message[] = [];
      let encounteredReadMessage = false;
      let fetchDate = Date.now() + 1;
      while (!encounteredReadMessage) {
        const newMessages = await getMessagesBeforeDate(chat_id, new Date(fetchDate), amountPerFetch);
        for (const element of newMessages) {
          if (element.created_at < fetchDate) {
            if (element.users_read?.find(val => val == userID)) {
              encounteredReadMessage = true;
              break;
            } else {
              messages.push(element);
              fetchDate = element.created_at;
            }
          }
        }
        if (newMessages.length < amountPerFetch) {
          break;
        }
      }

      if (callback) {
        callback(messages);
      }
    }
  }

  @CatchAsync
  @Validate
  async updateReadStatus(
    @val(validateToken) token: any,
    @val(readMessageSchema.validate.bind(readMessageSchema)) incomingMessageObject: any,
    @val(validateCallback) callback: Function | undefined
  ) {
    const user = await getUser(token);
    if (user && user._id) {
      const userID = user._id;
      const message = await getMessage(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
      if (typeof(message) == "undefined") {
        throw new Error("No such message");
      }

      message.users_read?.push(userID);
      await readMessage(message);
      
      this.socket.in(incomingMessageObject.chat_id).emit("update read status", message);

      if (callback) {
        callback(message);
      }
    }
  }

  @CatchAsync
  @Validate
  async reactToMessage(
    @val(validateToken) token: any,
    @val(readMessageSchema.validate.bind(readMessageSchema)) incomingMessageObject: any,
    incomingReaction: any,
    @val(validateCallback) callback: Function | undefined
  ) {
    const user = await getUser(token);
    if (user && user._id) {
      const userID = user._id;
      const message = await getMessage(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
      if (typeof(message) == "undefined") {
        throw new Error("No such message");
      }
      if (!PossibleReactions.includes(incomingReaction)) {
        throw new Error("Unsupported reaction");
      }
      await addReactionToMessage(message, userID, incomingReaction);
      const newMessage = await getMessage(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
      this.socket.in(message.chat_id).emit("react to message", newMessage);

      if (callback) {
        callback(newMessage);
      }
    }
  }

  @CatchAsync
  @Validate
  async getPossibleReactions(
    @val(validateCallback) callback: Function | undefined
  ) {
    if (callback) callback(PossibleReactions);
  }

  subscribe(): void {
    this.socket.on('ping', this.ping.bind(this));
    this.socket.on("chat message", this.chatMessage.bind(this));
    this.socket.on("set chat rooms", this.setChatRoomsAndOnline.bind(this));
    this.socket.on("get messages before", this.getMessagesBefore.bind(this));
    this.socket.on("delete chat message", this.deleteChatMessage.bind(this));
    this.socket.on("update chat message", this.updateChatMessage.bind(this));
    this.socket.on("writing", this.writing.bind(this));
    this.socket.on("get unread messages", this.getUnreadMessages.bind(this));
    this.socket.on("update read status", this.updateReadStatus.bind(this));
    this.socket.on("react to message", this.reactToMessage.bind(this));
    this.socket.on("get possible reactions", this.getPossibleReactions.bind(this));
    this.socket.on("disconnecting", this.disconnecting.bind(this))
  }

  unsubscrube() {
    throw new Error("Method not implemented");
  }
}
