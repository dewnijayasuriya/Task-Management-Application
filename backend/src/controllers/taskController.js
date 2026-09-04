const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { STATUSES } = require("../models/Task");

const POPULATE_FIELDS = [
  { path: "creator", select: "name email role" },
  { path: "assignedUser", select: "name email role" },
];

function isOwnerOrAdmin(task, user) {
  if (user.role === "ADMIN") return true;
  const creatorId = task.creator._id ? task.creator._id : task.creator;
  const assignedId = task.assignedUser
    ? task.assignedUser._id
      ? task.assignedUser._id
      : task.assignedUser
    : null;
  return (
    creatorId.toString() === user._id.toString() ||
    (assignedId && assignedId.toString() === user._id.toString())
  );
}

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;

  const task = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    status: status && STATUSES.includes(status) ? status : "TODO",
    creator: req.user._id,
    assignedUser: null,
  });

  await task.populate(POPULATE_FIELDS);

  res.status(201).json({ success: true, task });
});

// GET /api/tasks
// Admins see every task. Normal users see tasks they created or are assigned to,
// plus unassigned tasks (so they can pick one up).
const getTasks = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role !== "ADMIN") {
    filter = {
      $or: [
        { creator: req.user._id },
        { assignedUser: req.user._id },
        { assignedUser: null },
      ],
    };
  }

  const tasks = await Task.find(filter)
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: tasks.length, tasks });
});

// GET /api/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const task = await Task.findById(id).populate(POPULATE_FIELDS);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (req.user.role !== "ADMIN") {
    const creatorId = task.creator._id.toString();
    const assignedId = task.assignedUser ? task.assignedUser._id.toString() : null;
    const isUnassigned = !task.assignedUser;
    const isAllowed =
      creatorId === req.user._id.toString() ||
      assignedId === req.user._id.toString() ||
      isUnassigned;

    if (!isAllowed) {
      throw new AppError("You do not have access to this task", 403);
    }
  }

  res.status(200).json({ success: true, task });
});

// PUT /api/tasks/:id
// Normal users may only update tasks they created or are assigned to.
// Normal users may never change assignedUser through this endpoint (use /assign).
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const task = await Task.findById(id).populate(POPULATE_FIELDS);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isOwnerOrAdmin(task, req.user)) {
    throw new AppError("You do not have permission to update this task", 403);
  }

  const { title, description, status } = req.body;

  if (title !== undefined) {
    if (!title || !title.trim()) {
      throw new AppError("Task title cannot be empty", 400);
    }
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${STATUSES.join(", ")}`, 400);
    }
    task.status = status;
  }

  // assignedUser is intentionally ignored here; assignment has its own
  // dedicated endpoint with stricter rules (see assignTask below).

  await task.save();
  await task.populate(POPULATE_FIELDS);

  res.status(200).json({ success: true, task });
});

// PATCH /api/tasks/:id/status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  if (!STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${STATUSES.join(", ")}`, 400);
  }

  const task = await Task.findById(id).populate(POPULATE_FIELDS);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isOwnerOrAdmin(task, req.user)) {
    throw new AppError(
      "You do not have permission to change this task's status",
      403
    );
  }

  task.status = status;
  await task.save();
  await task.populate(POPULATE_FIELDS);

  res.status(200).json({ success: true, task });
});

// PATCH /api/tasks/:id/assign
// Normal users: may only assign an UNASSIGNED task to THEMSELVES.
// Admins: may assign/reassign to any user, at any time.
const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const task = await Task.findById(id).populate(POPULATE_FIELDS);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (req.user.role === "ADMIN") {
    if (!userId) {
      throw new AppError("userId is required to assign a task", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid userId", 400);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404);
    }

    task.assignedUser = targetUser._id;
  } else {
    // Normal user path — strictly self-assign, and only when currently unassigned.
    if (userId && userId.toString() !== req.user._id.toString()) {
      throw new AppError(
        "You are only allowed to assign this task to yourself",
        403
      );
    }

    if (task.assignedUser) {
      throw new AppError(
        "This task is already assigned and cannot be reassigned by a normal user",
        403
      );
    }

    task.assignedUser = req.user._id;
  }

  await task.save();
  await task.populate(POPULATE_FIELDS);

  res.status(200).json({ success: true, task });
});

// DELETE /api/tasks/:id
// Only the creator of the task or an admin may delete it.
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const isCreator = task.creator.toString() === req.user._id.toString();

  if (req.user.role !== "ADMIN" && !isCreator) {
    throw new AppError("You do not have permission to delete this task", 403);
  }

  await task.deleteOne();

  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};
