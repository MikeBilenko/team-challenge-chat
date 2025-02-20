import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
dotenv.config();

import { CassandraClient, connectWithRetry } from "./models/CassandraClient";
import { SocketEventHandler } from "./controllers/chatWebSocketControllers";
import { MessageModel } from "./models/Message";

const fs = require("fs")
const YAML = require('yaml')


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
  const socketEventHandler = new SocketEventHandler(socket);
  socketEventHandler.subscribe();
});

app.get("/chat", (_, res) => {
  res.sendFile("test_frontend/chat.html", {root: __dirname});
});


connectWithRetry(5, 5000).then(async () => {
  // TEST message insertion
  await MessageModel.addTestMessage();
  // console.log(await MessageModel.find({ chat_id: 'test_chat_id' }));
  // console.log((await MessageModel.find({ chat_id: 'test_chat_id' }))[0]!.users_read?.push("abc"));
  
  server.listen(PORT, () => {
    console.log(`Server is running. Use our API on port: ${PORT}`);
  });
})
