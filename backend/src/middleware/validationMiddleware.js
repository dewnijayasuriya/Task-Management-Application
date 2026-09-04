const AppError = require("../utils/AppError");
const { STATUSES } = require("../models/Task");

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are all required", 400));
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    return next(new AppError("Name must be at least 2 characters long", 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || !emailRegex.test(email)) {
    return next(new AppError("Please provide a valid email address", 400));
  }

  if (typeof password !== "string" || password.length < 6) {
    return next(new AppError("Password must be at least 6 characters long", 400));
  }

  // Defense in depth: normal registration must never be able to set role
  if (req.body.role) {
    delete req.body.role;
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  next();
}

function validateCreateTask(req, res, next) {
  const { title, description, status } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return next(new AppError("Task title is required", 400));
  }

  if (description !== undefined && typeof description !== "string") {
    return next(new AppError("Task description must be a string", 400));
  }

  if (status && !STATUSES.includes(status)) {
    return next(
      new AppError(`Status must be one of: ${STATUSES.join(", ")}`, 400)
    );
  }

  next();
}

function validateUpdateTask(req, res, next) {
  const { title, description, status } = req.body;

  if (title !== undefined && typeof title !== "string") {
    return next(new AppError("Task title must be a string", 400));
  }

  if (description !== undefined && typeof description !== "string") {
    return next(new AppError("Task description must be a string", 400));
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    return next(
      new AppError(`Status must be one of: ${STATUSES.join(", ")}`, 400)
    );
  }

  next();
}

function validateStatusUpdate(req, res, next) {
  const { status } = req.body;

  if (!status || !STATUSES.includes(status)) {
    return next(
      new AppError(`Status must be one of: ${STATUSES.join(", ")}`, 400)
    );
  }

  next();
}

function validateAssignTask(req, res, next) {
  const { userId } = req.body;

  if (userId !== undefined && typeof userId !== "string") {
    return next(new AppError("userId must be a string", 400));
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTask,
  validateUpdateTask,
  validateStatusUpdate,
  validateAssignTask,
};
