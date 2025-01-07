import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

import { CassandraClient, connectWithRetry } from "./models/CassandraClient";
import { chatMessageEventSubscribe, getMessagesBeforeEventSubscribe, pingEventSubscribe, setChatRoomsEventSubscribe } from "./controllers/chatWebSocketControllers";
import { MessageModel } from "./models/Message";

const fs = require("fs")
const YAML = require('yaml')

dotenv.config();

const { PORT = 4000 } = process.env;

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());


const file  = fs.readFileSync('./docs/swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = createServer(app);


const io = new Server(server, {
  cors: {
    origin: [
      // TODO update CORS
      "https://team-challenge-chat.netlify.app",
      "http://localhost:5173",
    ],
  },
  maxHttpBufferSize: 1e8, // for images
});

io.on("connection", (socket) => {
  setChatRoomsEventSubscribe(socket);
  pingEventSubscribe(socket);
  chatMessageEventSubscribe(socket);
  getMessagesBeforeEventSubscribe(socket);
});

app.get("/chat", (_, res) => {
  res.send(`<script src="/socket.io/socket.io.js"></script>
<input type="text" id="chatInput">
<script>
  const socket = io(); // put URL as a parameter
  socket.emit("ping", ()=>{console.log("pong delivered to server")});
  socket.on("pong", ()=>{console.log("pong")});

  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzA0NDdhMGEwYmNiODQ3MGQ5MjhlZSIsImlhdCI6MTczNjE3NDc5MiwiZXhwIjoxNzM2MTc4MzkyfQ.fjLDIaLrbirX7Nyt0kVO4JnC_1ndd6nr-_gAxC5AJnU";

  socket.emit("set chat rooms", token, (chats)=>{
    console.log(chats);

    const input = document.getElementById("chatInput");
    input.onchange = () => {
      console.log(input.value);
      const message = document.createElement("p");
      message.innerHTML = input.value;
      document.body.insertBefore(message, document.body.lastElement);
      socket.emit("chat message", token, { message: input.value, chat_id: chats[0]._id }, ()=>{
        console.log("chat message delivered")
      });
    }

    socket.emit(
        "get messages before", 
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzA0NDdhMGEwYmNiODQ3MGQ5MjhlZSIsImlhdCI6MTczNTQxMzAxMiwiZXhwIjoxNzM1NDE2NjEyfQ.rUjHAldTEAhwpSJO3GEx0BFfbwiTKN2cwHDB2NeQF7s", 
        chats[0]._id, Date.now(), (messages)=>{console.log(messages)});
  });


  socket.on("chat message", (messageObject) => {
    const message = document.createElement("p");
    console.log(messageObject);
    message.innerHTML = messageObject.name + ": " + messageObject.text;
    message.style.color = "blue";
    document.body.insertBefore(message, document.body.lastElement);
  })
</script>`);
});


connectWithRetry(5, 5000).then(async () => {
  await MessageModel.addTestMessage();
  server.listen(PORT, () => {
    console.log(`Server is running. Use our API on port: ${PORT}`);
  });
})
