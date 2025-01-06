import { Socket } from "socket.io";
import cassandra from "cassandra-driver";

import { createMessage } from "../services/messageServices";
import { getChats } from "../backend_api/chat_api";

function ping(socket: Socket) {
  return (callback: Function) => {
    console.log("ping");
    socket.broadcast.emit("pong");
    callback();
  }
}

export function pingEventSubscribe(socket: Socket) {
  const processor = ping(socket);
  socket.on('ping', processor);
  return processor;
}

function getChatRoomName(chatType: String, chatId: String) {
  return `${chatType}@${chatId}`;
}

function chatMessage(socket: Socket) {
  return async (incomingMessageObject: any, callback: Function) => {
    const messageText = incomingMessageObject.message;
    // let user_id = socket.user._id;
    let user_id = cassandra.types.Uuid.random();
    // let chat_id = incomingMessageObject.chat_id;
    let chat_id = cassandra.types.Uuid.random();
    let messageObject = (await createMessage({
      user_id: user_id, 
      text: messageText,
      images: [], // TODO: add images
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
    callback();
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
      for (const chat of chats) {
        socket.join(chat._id);
      }
      if (callback) {
        callback(chats);
      }
    }
  }
}

export function setChatRoomsEventSubscribe(socket: Socket) : (...any: any[]) => Promise<void> {
  const processor = setChatRooms(socket);
  socket.on("set chat rooms", processor);
  return processor;
}