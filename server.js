const http = require("http");
const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const {
  addEventListenersToSocket,
  emitActions,
} = require("./events")
const routes = require("./routes");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.WebSocketServer({
  clientTracking: true,
  noServer: true,
});

addEventListenersToSocket(wss)

app.use((req, _, next) => {
  req.socketServer = wss
  next()
})
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"));

const sessionParser = session({
  secret: "THIS SHOULD BE SECURE",
  resave: true,
  saveUninitialized: true,
  name: "my-socket-example",
  cookie: {
    // secure: true // doesn't work on localhost!
  },
});

app.use(sessionParser);

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(routes);

server.on("upgrade", function (req, socket, head) {
  const handleError = (err) => console.error(err);
  socket.on("error", handleError);
  sessionParser(req, {}, () => {
    if (!req.session.userID) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    socket.removeListener("error", handleError);
    wss.handleUpgrade(req, socket, head, function (ws) {
      ws.userID = req.session.userID
      wss.emit(emitActions.USER_CONNECTED, ws, req);
    });
  });
});

server.listen(
  PORT,
  () => console.log("Now listening on http://localhost:" + PORT),
);
