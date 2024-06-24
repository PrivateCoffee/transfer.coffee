import { Server } from "bittorrent-tracker";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.TRACKER_PORT || 8106;
const HOST = process.env.TRACKER_HOST || "localhost";

const port = Number(PORT);
if (isNaN(port) || port <= 0) {
  throw new Error("Invalid TRACKER_PORT value. It must be a positive number.");
}

const server = new Server({
  udp: false,
  http: false,
  ws: true,
  stats: false,
});

server.on("error", (err) => {
  console.error(`Error: ${err.message}`);
});

server.on("warning", (err) => {
  console.warn(`Warning: ${err.message}`);
});

server.on("listening", () => {
  console.log(`Tracker is listening on ws://${HOST}:${PORT}`);
});

try {
  server.listen(port, HOST, () => {
    console.log(`Tracker server started on ws://${HOST}:${PORT}`);
  });
} catch (err) {
  console.error(`Failed to start tracker server: ${err.message}`);
}