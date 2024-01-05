const { v4: uuidv4 } = require('uuid');
const roomsMap = new Map()
const usersMap = new Map()

async function createRoom(roomName, userID) {
  const id = uuidv4()
  const user = await getUserByID(userID)
  if (!user) throw new Error('user does not exist')
  const newRoom = {
    name: roomName,
    messages: [],
    users: [],
    createdBy: {
      id: user.id,
      username: user.username,
    }
  }
  roomsMap.set(id, newRoom)
  return {id, ...newRoom}
}

async function getRoomByID(roomID) {
  if (!roomsMap.has(roomID)) return null
  const room = roomsMap.get(roomID)
  return {id: roomID, ...room}
}

async function getAllRooms() {
  const roomEntries = roomsMap.entries()
  if (roomEntries.length === 0) return []
  const rooms = Array.from(roomEntries)
    .map(([id, {name, users, createdBy}]) => (
      {id, name, users, createdBy}
    ))
  return rooms
}

async function addUserToRoom(roomID, userID) {
  const room = roomsMap.get(roomID)
  if (!room) throw new Error('room not found')
  room.users.push(userID)
  roomsMap.set(roomID, room)
}

async function removeUserFromRoom(roomID, userID) {
  const room = roomsMap.get(roomID)
  if (!room) throw new Error('room not found')
  const userInRoom = room.users.find(roomUserID => userID === roomUserID)
  if (!userInRoom) return false
  room.users = room.users.filter(roomUserID => userID !== roomUserID)
  roomsMap.set(roomID, room)
  return true
}

async function getAllMessagesByRoom(roomID) {
  if (!roomsMap.has(roomID)) throw new Error('room does not exist')
  const room = roomsMap.get(roomID)?.messages
  return {id: roomID, ...room}
}

async function addMessageToRoom(roomID, author, message) {
  if (!roomsMap.has(roomID)) throw new Error('room does not exist')
  const currentRoom = roomsMap.get(roomID)
  const newMessage = {
    timestamp: new Date(),
    id: uuidv4(),
    author,
    message,
  }
  currentRoom.messages.push(newMessage)
  roomsMap.set(roomID, currentRoom)
  return {roomID, ...newMessage}
}

async function createUser(username) {
  // don't duplicate users by username
  const existingUser = await getUserByUsername(username)
  if (existingUser) throw new Error('user already exists')
  const user = {username}
  const id = uuidv4()
  usersMap.set(id, user)
  return {id, ...user} 
}

async function getUserByID(id) {
  if (!usersMap.has(id)) return null
  const user = usersMap.get(id)
  return {id, ...user}
}

async function getUserByUsername(username) {
  const userArr = Array.from(usersMap.entries()).find(([_, user]) => user.username === username)
  if (!userArr || userArr.length === 0) return null
  const [id, user] = userArr
  return {id, ...user}
}

async function removeUser(userID) {
  usersMap.delete(userID)
}

module.exports = {
  users: {
    create: createUser,
    getByID: getUserByID,
    getByUsername: getUserByUsername,
    remove: removeUser,
  },
  rooms: {
    create: createRoom,
    messages: {
      getAllByRoomID: getAllMessagesByRoom,
      addToRoom: addMessageToRoom,
    },
    getAll: getAllRooms,
    getByID: getRoomByID,
    addUser: addUserToRoom,
    removeUser: removeUserFromRoom,
  }
}
