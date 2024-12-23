import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

import { CassandraClient, connectWithRetry } from "./models/CassandraClient";
import { chatMessageEventSubscribe, pingEventSubscribe } from "./controllers/chatWebSocketControllers";

const fs = require("fs")
const YAML = require('yaml')

dotenv.config();

const { DB_HOST, PORT = 4000 } = process.env;

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
});

// TODO middlewares
// io.use(authenticateSocket);
// io.use(authorizeSocketForRole("verified"));

io.on("connection", (socket) => {
  // TODO set chat rooms for the socket
  // chatControllers.setChatRooms(socket);
  pingEventSubscribe(socket);
  chatMessageEventSubscribe(socket);
});

app.get("/chat", (_, res) => {
  res.send(`<script src="/socket.io/socket.io.js"></script>
<input type="text" id="chatInput">
<script>
  const socket = io(); // put URL as a parameter
  socket.emit("ping", ()=>{console.log("pong delivered to server")});
  socket.on("pong", ()=>{console.log("pong")});

  const input = document.getElementById("chatInput");
  input.onchange = () => {
    console.log(input.value);
    const message = document.createElement("p");
    message.innerHTML = input.value;
    document.body.insertBefore(message, document.body.lastElement);
    socket.emit("chat message", { message: input.value}, ()=>{
      console.log("chat message delivered")
    });
  }

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
  server.listen(PORT, () => {
    console.log(`Server is running. Use our API on port: ${PORT}`);
  });
})
