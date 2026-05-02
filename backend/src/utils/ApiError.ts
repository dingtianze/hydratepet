export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
