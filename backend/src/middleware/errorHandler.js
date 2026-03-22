// Error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Don't expose stack traces in production
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };
  
  res.status(statusCode).json(response);
}

// Async handler wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
};
