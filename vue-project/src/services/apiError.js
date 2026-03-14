/**
 * Structured API error that preserves the backend error contract.
 *
 * Backend shape (inside axios error.response.data):
 *   { success: false, message: "...", data: ApiError }
 *
 * ApiError fields: status, errorCode, type, message, detail,
 *                  timestamp, validationErrors?
 */
export class ApiError extends Error {
  constructor(apiData, originalError) {
    const userMessage = apiData.detail || apiData.message || "Unknown error";
    super(userMessage);
    this.name = "ApiError";
    this.status = apiData.status;
    this.errorCode = apiData.errorCode;
    this.type = apiData.type;
    this.detail = apiData.detail || null;
    this.validationErrors = apiData.validationErrors || null;
    this.timestamp = apiData.timestamp;
    this.originalError = originalError;
  }
}

/**
 * Attempts to extract an ApiError from an axios error.
 * Returns an ApiError instance if the response matches the backend contract,
 * or null if it doesn't.
 */
export function extractApiError(axiosError) {
  const responseData = axiosError?.response?.data;
  if (!responseData) return null;

  // Backend wraps errors in ApiResponse: { success, message, data: ApiError }
  const apiErrorData = responseData.data;

  if (apiErrorData && apiErrorData.errorCode) {
    return new ApiError(apiErrorData, axiosError);
  }

  // Fallback: error might be at root level (some endpoints)
  if (responseData.errorCode) {
    return new ApiError(responseData, axiosError);
  }

  return null;
}

/**
 * Returns user-facing message for a given error (ApiError or plain Error).
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.detail || error.message;
  }
  return error?.message || "Unknown error";
}

/**
 * Returns field-level validation errors map, or null.
 */
export function getValidationErrors(error) {
  if (error instanceof ApiError && error.errorCode === "VAL_REQUEST_BODY_INVALID") {
    return error.validationErrors || null;
  }
  return null;
}
