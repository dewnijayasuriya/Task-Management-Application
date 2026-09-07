const mongoose = require("mongoose");

const STATUSES = ["TODO", "DOING", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title must be at most 200 characters long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description must be at most 2000 characters long"],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: "Status must be one of TODO, DOING, DONE",
      },
      default: "TODO",
      required: true,
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: "Priority must be one of LOW, MEDIUM, HIGH",
      },
      default: "MEDIUM",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ creator: 1 });
taskSchema.index({ assignedUser: 1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
