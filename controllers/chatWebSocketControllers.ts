import { Socket } from "socket.io";
import { createMessage, getMessageById, getMessagesBeforeDate, removeMessageById, updateMessage } from "../services/messageServices";
import { getChats, userIsInChat, userIsModeratorInChat } from "../backend_api/chat_api";
import { uploadToCloudinary } from "../services/cloudinary";
import { getUser } from "../backend_api/user_api";
import { Catch, CatchAsync } from "../middlewares/Catch";

function ping(socket: Socket) {
  return (callback: Function) => {
    console.log("ping");
    socket.broadcast.emit("pong");
    if (callback instanceof Function) {
      callback();
    }
    throw new Error("new error in ping");
  }
}

export function pingEventSubscribe(socket: Socket) {
  const processor = Catch(ping(socket));
  socket.on('ping', processor);
  return processor;
}

function chatMessage(socket: Socket) {
  return async (token: string, incomingMessageObject: any, callback: Function) => {
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

    console.log(images);

    let messageObject = (await createMessage({
      user_id: user_id, 
      text: messageText,
      images: images, // TODO: add images
      responds_to_message_id: incomingMessageObject.responds_to_message_id,
      reactions: [],
      chat_id: chat_id,
    }));
    const name = user.name;
    // const name = "A";
    const profilePicture = user.avatar || "https://res.cloudinary.com/dtonpxhk7/image/upload/v1727784788/fvqcrnaneokovnfwcgya.jpg";    
    // const profilePicture = "https://res.cloudinary.com/dtonpxhk7/image/upload/v1727784788/fvqcrnaneokovnfwcgya.jpg";    
    const outgoingMessage = { name, profilePicture, ...messageObject }
    if (true) {
      socket.to(messageObject.chat_id.toString()).emit("chat message", outgoingMessage);
    } else { // TODO remove "else"
      socket.broadcast.emit("chat message", outgoingMessage);
    }
    if (typeof(callback) == "function") {
      callback(messageObject);
    }
  }
}

export function chatMessageEventSubscribe(socket: Socket) {
  const processor = CatchAsync(chatMessage(socket));
  socket.on("chat message", processor);
  return processor;
}

function setChatRooms(socket: Socket) : (...any: any[]) => Promise<void> {
  return async (token: any, callback: Function) => {
    if (typeof token != "string") {
      throw new Error("No token");
    } else {
      const chats = await getChats(token);   
      if (chats.length) {
        for (const chat of chats) {
          socket.join(chat._id);
        }
      } else {
        // throw new Error("No chats returned from backend service");
      }
      callback(chats);
    }
  }
}

export function setChatRoomsEventSubscribe(socket: Socket) : (...any: any[]) => Promise<void> {
  const processor = CatchAsync(setChatRooms(socket));
  socket.on("set chat rooms", processor);
  return processor;
}

function getMessagesBefore(socket: Socket) : (...any: any[]) => Promise<void> {
  return async (token: any, chat_id: string, date: Date, callback: Function) => {
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
}

export function getMessagesBeforeEventSubscribe(socket: Socket) : (...any: any[]) => Promise<void> {
  const processor = CatchAsync(getMessagesBefore(socket));
  socket.on("get messages before", processor);
  return processor;
}

function deleteChatMessage(socket: Socket) {
  return async (token: string, incomingMessageObject: any, callback: Function) => {
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
    
    if (true) {
      socket.to(message!.chat_id.toString()).emit("delete chat message", message!.id);
    } else { // TODO remove "else"
      socket.broadcast.emit("delete chat message", message!.id);
    }

    if (typeof(callback) == "function") {
      callback(message);
    }
  }
}

export function deleteChatMessageEventSubscribe(socket: Socket) {
  const processor = CatchAsync(deleteChatMessage(socket));
  socket.on("delete chat message", processor);
  return processor;
}

function updateChatMessage(socket: Socket) {
  return async (token: string, incomingMessageObject: any, callback: Function) => {
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
    
    if (true) {
      socket.to(message!.chat_id.toString()).emit("update chat message", message);
    } else { // TODO remove "else"
      socket.broadcast.emit("update chat message", message);
    }

    if (typeof(callback) == "function") {
      callback(message);
    }
  }
}

export function updateChatMessageEventSubscribe(socket: Socket) {
  const processor = CatchAsync(updateChatMessage(socket));
  socket.on("update chat message", processor);
  return processor;
}