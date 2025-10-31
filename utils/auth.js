const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_SECRET  = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

// Password helpers
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// JWT helpers
function signAccessToken(user) {
  // keep payload minimal; sub = subject (user id)
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws if invalid/expired
}

module.exports = {
  hashPassword,
  comparePassword,
  signAccessToken,
  verifyAccessToken,
};
