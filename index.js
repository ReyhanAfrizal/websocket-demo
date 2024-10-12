const { createServer } = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const { parse } = require("url");

const PORT = 8081;
const server = createServer();
const TOKEN_SIMULATION = "abc";

const wsServer = new WebSocketServer({ noServer: true });

function authenticate(request) {
  const { token } = parse(request.url, true).query;
  return token === TOKEN_SIMULATION;
}

function unauthorized(socket) {
  socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
  socket.destroy();
  return;
}

server.on("upgrade", (request, socket, head) => {
  const isAuthenticated = authenticate(request);

  if (!isAuthenticated) {
    return unauthorized;
  }

  wsServer.handleUpgrade(request, socket, head, (connection) => {
    wsServer.emit("connection", connection, request);
  });
});

wsServer.on("connection", (connection) => {
  console.log("connection estabilished");
  connection.send(JSON.stringify({ message: "Hello From Server" }));

  connection.on("message", (bytes) => {
    wsServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(JSON.parse(bytes)));
      }
    });
  });
});

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
