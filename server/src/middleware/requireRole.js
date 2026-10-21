import { ApiError } from "../utils/ApiError.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          "FORBIDDEN",
          "You do not have permission to perform this action",
        ),
      );
      return;
    }
    next();
  };
}
