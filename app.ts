import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { CassandraClient, connectWithRetry } from "./models/CassandraClient";

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

connectWithRetry(5, 5000).then(async () => {
  server.listen(PORT, () => {
    console.log(`Server is running. Use our API on port: ${PORT}`);
  });
})
