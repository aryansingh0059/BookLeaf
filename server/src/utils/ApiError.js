export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code, message, details) {
    return new ApiError(401, code, message, details);
  }

  static forbidden(code, message, details) {
    return new ApiError(403, code, message, details);
  }

  static notFound(code, message, details) {
    return new ApiError(404, code, message, details);
  }

  static conflict(code, message, details) {
    return new ApiError(409, code, message, details);
  }

  static unprocessable(code, message, details) {
    return new ApiError(422, code, message, details);
  }

  static tooMany(code, message, details) {
    return new ApiError(429, code, message, details);
  }

  static serviceUnavailable(code, message, details) {
    return new ApiError(503, code, message, details);
  }
}

export class AIUnavailableError extends Error {
  constructor(message = 'AI service is unavailable', cause) {
    super(message);
    this.name = 'AIUnavailableError';
    this.cause = cause;
  }
}
