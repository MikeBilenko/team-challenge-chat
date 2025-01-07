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
  res.sendFile("test_frontend/chat.html", {root: __dirname});
});


connectWithRetry(5, 5000).then(async () => {
  // TEST message insertion
  await MessageModel.addTestMessage();
  server.listen(PORT, () => {
    console.log(`Server is running. Use our API on port: ${PORT}`);
  });
})
