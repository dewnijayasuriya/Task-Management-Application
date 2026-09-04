const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  // role is always forced to USER; ADMIN accounts can only be created via the seed script
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: "USER",
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

module.exports = { register, login, getMe };
