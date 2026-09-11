const express = require("express");
const { getUsers } = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", getUsers); // Only admins can view all users.

module.exports = router;
