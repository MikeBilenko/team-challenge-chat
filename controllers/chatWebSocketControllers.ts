import { DefaultEventsMap, Socket } from "socket.io";
import { createMessage, getMessageById, getMessagesBeforeDate, removeMessageById, updateMessage } from "../services/messageServices";
import { getChats, userIsInChat, userIsModeratorInChat } from "../backend_api/chat_api";
import { uploadToCloudinary } from "../services/cloudinary";
import { getUser } from "../backend_api/user_api";
import { Catch, CatchAsync } from "../middlewares/Catch";
import { getOnlineStatus, setOnlineStatus } from "../services/onlineStatusServices";
import { val, Validate } from "../middlewares/Validate";
import { validateToken } from "../schemas/validateToken";
import { validateCallback } from "../schemas/validateCallback";
import { deleteMessageSchema, incomingMessageSchema, updateMessageSchema } from "../schemas/messageSchemas";

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
    const message = await getMessageById(incomingMessageObject.chat_id, incomingMessageObject.id, incomingMessageObject.created_at);
    
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
    
    await updateMessage( { ...incomingMessageObject });
    
    this.socket.to(message!.chat_id.toString()).emit("update chat message", incomingMessageObject);

    if (typeof(callback) == "function") {
      callback(incomingMessageObject);
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

  subscribe(): void {
    this.socket.on('ping', this.ping.bind(this));
    this.socket.on("chat message", this.chatMessage.bind(this));
    this.socket.on("set chat rooms", this.setChatRoomsAndOnline.bind(this));
    this.socket.on("get messages before", this.getMessagesBefore.bind(this));
    this.socket.on("delete chat message", this.deleteChatMessage.bind(this));
    this.socket.on("update chat message", this.updateChatMessage.bind(this));
    this.socket.on("writing", this.writing.bind(this));
    this.socket.on("disconnecting", this.disconnecting.bind(this))
  }

  unsubscrube() {
    throw new Error("Method not implemented");
  }
}
