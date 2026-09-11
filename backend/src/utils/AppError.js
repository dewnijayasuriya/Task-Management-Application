// Custom error class to handle application-specific errors.
class AppError extends Error {
  constructor(message, statusCode) { // The constructor receives the error message and the HTTP status code that should be returned.
    super(message); // Call the parent class (Error) constructor with the message.
    this.statusCode = statusCode; // Store the HTTP status code for later use in the error handler.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
