const db = require("./db");

const messageActions = {
  USER_JOINED: "USER_JOINED",
  MESSAGE_TO_SERVER: "MESSAGE_TO_SERVER",
  MESSAGE_TO_CLIENT: "MESSAGE_TO_CLIENT",
  DELETE_ROOM: "DELETE_ROOM",
  ROOM_DELETED: "ROOM_DELETED",
};

function setupSocketServer(socketServer) {
  socketServer.broadcastRoomsToAllUsers = broadcastRoomsToAllUsers;
  socketServer.broadcastMessageToRoom = broadcastMessageToRoom;

  socketServer.on("connection", async (socket) => {
    const rooms = await db.rooms.getAll();
    const mappedRooms = rooms.map((room) => ({
      ...room,
      owner: room.createdBy.userID === socket.request.session.userID,
    }));

    broadcastRoomsToUser(socket, mappedRooms);

    socket.on(messageActions.USER_JOINED, async (data) => {
      socket.request.session.currentRoomID = data.roomID;
      socket.join(data.roomID);
      await db.rooms.addUser(data.roomID, socket.request.session.userID);
      await socketServer.broadcastMessageToRoom(
        data.roomID,
        "Server",
        `User ${socket.request.session.username} has joined.`,
        socket.request.session.userID,
      );
    });

    socket.on(messageActions.MESSAGE_TO_SERVER, async (data) => {
      await db.rooms.messages.addToRoom(
        data.roomID,
        socket.request.session.username,
        data.message,
      );
      socketServer.broadcastMessageToRoom(
        data.roomID,
        socket.request.session.username,
        data.message,
      );
    });

    socket.on("disconnect", async () => {
      const { userID, currentRoomID: roomID } = socket.request.session;
      const user = await db.users.getByID(userID);
      if (roomID && user) {
        const userWasRemoved = await db.rooms.removeUser(roomID, userID);
        if (userWasRemoved) {
          socketServer.broadcastMessageToRoom(
            roomID,
            "Server",
            `User ${user.username} left.`,
          );
        }
      }
      socket.request.session.currentRoomID = null;
    });
  });
}

async function broadcastRoomsToUser(socket, rooms) {
  socket.emit("ROOM_LIST", rooms);
}

async function broadcastRoomsToAllUsers() {
  const rooms = await db.rooms.getAll();
  const sockets = await this.fetchSockets();
  for (const socket of sockets) {
    const mappedRooms = rooms.map((room) => ({
      ...room,
      owner: room.createdBy.userID === socket.request.session.userID,
    }));
    broadcastRoomsToUser(socket, mappedRooms);
  }
}

async function broadcastMessageToRoom(
  roomID,
  authorName,
  message,
  excludedUserID,
) {
  const sockets = await this.in(roomID).fetchSockets();
  for (const socket of sockets) {
    if (socket.request.session.userID === excludedUserID) continue;
    socket.emit(messageActions.MESSAGE_TO_CLIENT, {
      authorName,
      message,
    });
  }
}

module.exports = {
  setupSocketServer,
};
