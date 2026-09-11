const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["USER", "ADMIN"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Removes unnecessary spaces from the beginning and end.
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name must be at most 100 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: "Role must be either USER or ADMIN",
      },
      default: "USER",
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password before saving it to the database.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) { // If the password field hasn't been modified (e.g., during an update), we don't need to hash it again.
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // Hash the password using bcrypt with a salt factor of 10.
  next();
});

// bcrypt checks whether the entered password matches the stored hash.
userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// This method returns a safe representation of the user object, excluding sensitive information like the password.
userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
