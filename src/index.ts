import "dotenv/config";

import cors from "cors";
import express from "express";

import router from "./routes";

const serverPort = process.env.PORT || 3333;
const server = express();

server.use(cors());
server.use(router);

server.listen(serverPort, () =>
  console.log(`server is up at http://0.0.0.0:${serverPort}`)
);
