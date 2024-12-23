import { Socket } from "socket.io";

// export async function authenticateSocket(socket: Socket, next: Function) {
//   const token = socket.handshake.auth.token;
//   try {
//     const user_id = jwt.verify(token, JWT_SECRET).id;
//     socket.user = await findUserById(user_id);
//   } catch (error) {
//     next(Error("Not authorized"));
//   }
//   next();
// }

