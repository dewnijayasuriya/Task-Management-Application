const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Middleware to authenticate the user based on the JWT token provided in the Authorization header.
const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new AppError("Authentication token is missing", 401);
  }

  let decoded; // Creates a variable to store the information extracted from the JWT.
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }

  // Fetch the user from the database using the ID extracted from the token. This confirms that the user still exists in the database.
  const user = await User.findById(decoded.id); 
  if (!user) {
    throw new AppError("User belonging to this token no longer exists", 401);
  }

  req.user = user; // Attaches the authenticated user to the request.
  next(); // Proceeds to the next middleware or route handler.
});

module.exports = { authenticateToken };
