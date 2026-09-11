const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express(); // Initialize the Express app

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());


const corsOptions = {
  origin: (origin, callback) => {  // Check if the origin is in the allowed origins list
    if (!origin || allowedOrigins.includes(origin)) { // Allow requests with no origin (like mobile apps or curl requests) or if the origin is in the allowed list
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.) to be sent in cross-origin requests
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"], // Specify the allowed HTTP methods for cross-origin requests
};

app.options("*", cors(corsOptions));
app.use(
  cors(corsOptions)
);

// Parse incoming JSON request bodies.
// This allows controllers to access data using req.body.
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse incoming URL-encoded request bodies (like form submissions).

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
