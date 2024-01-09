const router = require("express").Router();
const db = require("../db");
const checkAuth = require("../middleware/checkAuth");

router.get("/login", async (req, res) => {
  const { username } = req.query;
  if (!username) res.redirect("/");
  try {
    const user = await db.users.create(username);
    req.session.userID = user.id;
    req.session.username = user.username;
    res.redirect("/");
  } catch(err) {
    res.status(400).send(err.message);
  }
});

router.get("/logout", async (req, res) => {
  await db.users.remove(req.session.userID)
  req.session.destroy();
  res.redirect("/")
});

router.post("/room", checkAuth, async (req, res) => {
  const room = await db.rooms.create(req.body.roomname, req.session.userID);
  req.io.broadcastRoomsToAllUsers()
  res.redirect("/room/" + room.id);
});

module.exports = router;
