const AppError = require("../utils/AppError");

function authorizeRoles(...allowedRoles) {
  return function roleCheck(req, res, next) { // Middleware function to check if the authenticated user has one of the allowed roles.
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) { // If the user's role is not in the list of allowed roles, return a 403 Forbidden error.
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
}

module.exports = { authorizeRoles };
