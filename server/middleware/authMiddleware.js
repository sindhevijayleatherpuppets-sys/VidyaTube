const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET =
  process.env.JWT_SECRET || "vidytube_production_jwt_super_secure_secret_key_2026";

/**
 * Protects a route: requires a valid Bearer JWT in the Authorization header.
 * Attaches the authenticated user (without password) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Restricts a route to admin users only. Must run after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Admin access required" });
};

/**
 * Like `protect`, but does not fail the request if no/invalid token is present.
 * Used on public routes (e.g. video watch page) that behave differently for
 * logged-in users (view/history tracking) without requiring login to view.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch (error) {
      // Invalid token on a public route - just proceed as anonymous
    }
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
