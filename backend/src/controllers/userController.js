const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/users  (ADMIN only)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((u) => u.toSafeObject()),
  });
});

module.exports = { getUsers };
