const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "vidytube_production_jwt_super_secure_secret_key_2026";

/**
 * Sign a JWT containing the user's id.
 * @param {string} userId - Mongo ObjectId of the user
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
