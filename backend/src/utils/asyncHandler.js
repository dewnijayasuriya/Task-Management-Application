//The asyncHandler function catches errors from asynchronous functions without writing repetitive try-catch blocks and passes 
// them to the global error handler

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
