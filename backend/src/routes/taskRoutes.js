const express = require("express");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
} = require("../controllers/taskController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  validateCreateTask,
  validateUpdateTask,
  validateStatusUpdate,
  validateAssignTask,
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.route("/").post(validateCreateTask, createTask).get(getTasks);

router
  .route("/:id")
  .get(getTaskById)
  .put(validateUpdateTask, updateTask)
  .delete(deleteTask);

router.patch("/:id/status", validateStatusUpdate, updateTaskStatus);
router.patch("/:id/assign", validateAssignTask, assignTask);

module.exports = router;
