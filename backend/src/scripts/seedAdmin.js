require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function seedAdmin() {
  const {
    MONGODB_URI,
    ADMIN_NAME = "System Administrator",
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set. Aborting seed.");
    process.exit(1);
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed an administrator."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for admin seeding.");

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      if (existingAdmin.role !== "ADMIN") {
        existingAdmin.role = "ADMIN";
        await existingAdmin.save();
        console.log(`Existing user promoted to ADMIN: ${existingAdmin.email}`);
      } else {
        console.log(`Administrator already exists: ${existingAdmin.email}`);
      }
    } else {
      // Password hashing is handled by the User model's pre-save hook.
      const admin = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        role: "ADMIN",
      });
      console.log(`Administrator created successfully: ${admin.email}`);
    }
  } catch (error) {
    console.error("Failed to seed administrator:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

seedAdmin();
