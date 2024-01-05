const router = require('express').Router()
const db = require('../db')
const checkAuth = require('../middleware/checkAuth')

router.get('/', (req, res) => {
  res.render('index', {
    isLoggedIn: !!req.session.userID,
    username: req.session.username,
  })
})

router.get('/room/:roomID', checkAuth, async (req, res) => {
  const roomID = req.params.roomID
  if (!roomID) return res.redirect("/")
  const room = await db.rooms.getByID(roomID)
  if (!room) return res.redirect("/")
  res.render('room', {
    name: room.name,
    username: req.session.username,
    messages: room.messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }) 
})

module.exports = router
