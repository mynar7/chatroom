module.exports = function (req, res, next) {
  if (req.session.userID) return next();
  if (req.method === "GET") {
    return res.redirect('/')
  }
  return res.status(401).end();
};
