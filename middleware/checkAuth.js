module.exports = function(req, res, next) {
  if (!req.session.userID) res.status(401).end()
  next()
}
