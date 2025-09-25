const { verifyAccessToken } = require("../utils/auth");


function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" "); // expect "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
