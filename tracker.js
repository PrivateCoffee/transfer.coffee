import { Server } from "bittorrent-tracker";

const PORT = process.env.TRACKER_PORT || 8106;
const HOST = process.env.TRACKER_HOST || "localhost";

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
  console.log(`Tracker is listening on http://${HOST}:${PORT}`);
});

server.listen(PORT);
