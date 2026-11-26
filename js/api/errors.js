/**
 * Base error for every rejection from the Api adapter.
 *
 * The future HttpApi maps the same codes onto HTTP responses, so the UI can
 * branch on `code` without knowing which adapter it is talking to.
 */
export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Record<string, unknown>} [details]
   */
  constructor(code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export class StorageError extends ApiError {
  /**
   * @param {string} [message]
   * @param {unknown} [cause]
   */
  constructor(message = 'Browser storage is unavailable or full.', cause) {
    super('storage_unavailable', message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export class NotImplementedError extends ApiError {
  /**
   * @param {string} method
   */
  constructor(method) {
    super('not_implemented', `${method} is not implemented in this build.`);
    this.name = 'NotImplementedError';
    this.method = method;
  }
}
