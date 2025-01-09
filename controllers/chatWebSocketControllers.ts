import { Socket } from "socket.io";
import cassandra from "cassandra-driver";

import { createMessage, getMessagesBeforeDate } from "../services/messageServices";
import { getChats, userIsInChat } from "../backend_api/chat_api";
import { writeFile } from "fs";
import { uploadToCloudinary } from "../services/cloudinary";

function ping(socket: Socket) {
  return (callback: Function) => {
    console.log("ping");
    socket.broadcast.emit("pong");
    if (typeof(callback) == "function") {
      callback();
    }
  }
}

export function pingEventSubscribe(socket: Socket) {
  const processor = ping(socket);
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
      for (let i = 0; incomingMessageObject.images[i]; i++) {
        let file = incomingMessageObject.images[i];
        images.push(await uploadToCloudinary(file));
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
    // const name = socket.user.name;
    const name = "A";
    // const profilePicture = socket.user.profile_picture || "https://res.cloudinary.com/dtonpxhk7/image/upload/v1727784788/fvqcrnaneokovnfwcgya.jpg";    
    const profilePicture = "https://res.cloudinary.com/dtonpxhk7/image/upload/v1727784788/fvqcrnaneokovnfwcgya.jpg";    
    const outgoingMessage = { name, profilePicture, ...messageObject }
    if (false) {
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
  const processor = chatMessage(socket);
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
        throw new Error("No chats returned from backend service");
      }
      callback(chats);
    }
  }
}

export function setChatRoomsEventSubscribe(socket: Socket) : (...any: any[]) => Promise<void> {
  const processor = setChatRooms(socket);
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
  const processor = getMessagesBefore(socket);
  socket.on("get messages before", processor);
  return processor;
}