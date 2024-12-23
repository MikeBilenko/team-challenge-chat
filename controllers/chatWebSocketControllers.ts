import { Socket } from "socket.io";
import cassandra from "cassandra-driver";

import { createMessage } from "../services/messageServices";

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

// export async function setChatRooms(socket) {
//   const chats = await getChatsWithLastMessages(socket.user);  
//   for (const chat of chats) {    
//     socket.join(getChatRoomName(chat.chatType, chat._id));
//   }
// }