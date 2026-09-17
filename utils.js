export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: "خطای داخلی سرور" });
}