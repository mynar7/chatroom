const db = require("./db");
const WebSocket = require("ws");

const emitActions = {
  ROOM_CREATED: "ROOM_CREATED",
  USER_QUIT: "USER_QUIT",
  USER_CONNECTED: "USER_CONNECTED",
  ROOM_DELETED: "ROOM_DELETED",
};

function addEventListenersToSocket(socketServer) {
  socketServer.on(emitActions.USER_CONNECTED, async (ws, req) => {
    const rooms = await db.rooms.getAll();
    rooms.map((room) => ({
      ...room,
      owner: room.createdBy.userID === req.session.userID,
    }));
    broadcastRoomsToUser(ws, rooms);

    ws.on("error", console.error);

    ws.on("message", async (message) => {
      const messageData = JSON.parse(message);
      messageHandler(socketServer, ws, req, messageData);
    });

    ws.on("close", () => {
      socketServer.emit(
        emitActions.USER_QUIT,
        req.session.userID,
        req.session.currentRoomID,
      );
    });
  });

  socketServer.on(emitActions.ROOM_CREATED, () => {
    broadcastRoomsToAllUsers(socketServer);
  });

  socketServer.on(emitActions.USER_QUIT, async (userID, roomID) => {
    const user = await db.users.getByID(userID);
    if (roomID && user) {
      const userWasRemoved = await db.rooms.removeUser(roomID, userID);
      if (userWasRemoved) {
        broadcastMessageToRoom(
          socketServer,
          roomID,
          "Server",
          `User ${user.username} left.`,
        );
      }
    }
  });
}

const messageActions = {
  USER_JOINED: "USER_JOINED",
  MESSAGE_TO_SERVER: "MESSAGE_TO_SERVER",
  MESSAGE_TO_CLIENT: "MESSAGE_TO_CLIENT",
  DELETE_ROOM: "DELETE_ROOM",
  ROOM_DELETED: "ROOM_DELETED",
};

async function messageHandler(socketServer, socket, request, message) {
  const { type, data } = message;
  switch (type) {
    case messageActions.USER_JOINED:
      request.session.currentRoomID = data.roomID;
      await db.rooms.addUser(data.roomID, request.session.userID);
      await broadcastMessageToRoom(
        socketServer,
        data.roomID,
        "Server",
        `User ${request.session.username} has joined.`,
        request.session.userID,
      );
      break;
    case messageActions.MESSAGE_TO_SERVER:
      await db.rooms.messages.addToRoom(
        data.roomID,
        request.session.username,
        data.message,
      );
      broadcastMessageToRoom(
        socketServer,
        data.roomID,
        request.session.username,
        data.message,
      );
      break;
  }
}

async function broadcastRoomsToUser(socket, rooms) {
  socket.send(JSON.stringify({
    type: "ROOM_LIST",
    data: rooms,
  }));
}

async function broadcastRoomsToAllUsers(socketServer) {
  const rooms = await db.rooms.getAll();
  socketServer.clients.forEach((client) => broadcastRoomsToUser(client, rooms));
}

async function broadcastMessageToRoom(
  socketServer,
  roomID,
  authorName,
  message,
  excludedUserID,
) {
  const room = await db.rooms.getByID(roomID);
  socketServer.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (!room.users.includes(client.userID)) return;
    if (client.userID === excludedUserID) return;

    client.send(JSON.stringify({
      type: messageActions.MESSAGE_TO_CLIENT,
      data: {
        authorName,
        message,
      },
    }));
  });
}

module.exports = {
  emitActions,
  addEventListenersToSocket,
};
