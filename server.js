const http = require("http");
const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const { Server: SocketServer } = require('socket.io')
const PORT = process.env.PORT || 3000;

const {
  setupSocketServer,
} = require("./sockets")

const routes = require("./routes");

const app = express();

const httpServer = http.createServer(app);

const io = new SocketServer(httpServer)

setupSocketServer(io)
app.use((req, _, next) => {
  req.io = io
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
io.engine.use(sessionParser)
io.use((socket, next) => {
  if (!socket.request.session.userID) socket.disconnect()
  next()
})

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(routes);

httpServer.listen(
  PORT,
  () => console.log("Now listening on http://localhost:" + PORT),
);
