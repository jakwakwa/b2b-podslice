/**
 * Error utility to parse and format API errors into human-readable messages
 */

export interface ApiError {
  code?: number | string;
  message: string;
  status?: string;
}

export interface FormattedError {
  title: string;
  message: string;
  action: string;
  icon: string;
}

/**
 * Parse error from various formats (string, Error object, API response)
 */
export function parseApiError(error: unknown): ApiError {
  // Handle string errors
  if (typeof error === "string") {
    return { message: error };
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Try to parse JSON from error message
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        return {
          code: parsed.error.code,
          message: parsed.error.message,
          status: parsed.error.status,
        };
      }
    } catch {
      // Not JSON, use message as-is
    }
    return { message: error.message };
  }

  // Handle object errors
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Handle nested error object
    if (err.error && typeof err.error === "object") {
      const nestedError = err.error as Record<string, unknown>;
      return {
        code: nestedError.code as number | string,
        message: nestedError.message as string,
        status: nestedError.status as string,
      };
    }

    // Handle direct error properties
    return {
      code: err.code as number | string,
      message: err.message as string || "An unknown error occurred",
      status: err.status as string,
    };
  }

  return { message: "An unknown error occurred" };
}

/**
 * Format API error into human-readable message with appropriate icon and action
 */
export function formatErrorForDisplay(error: unknown): FormattedError {
  const apiError = parseApiError(error);
  const code = apiError.code;
  const status = apiError.status;

  // Handle specific error codes
  if (code === 503 || status === "UNAVAILABLE") {
    return {
      title: "Service Temporarily Unavailable",
      message: "The AI model is currently experiencing high demand and is overloaded. This is a temporary issue.",
      action: "Please try again in a few moments. If the problem persists, try again in 5-10 minutes.",
      icon: "⏳",
    };
  }

  if (code === 429 || status === "RESOURCE_EXHAUSTED") {
    return {
      title: "Rate Limit Reached",
      message: "You've made too many requests in a short period.",
      action: "Please wait a moment before trying again.",
      icon: "⚠️",
    };
  }

  if (code === 401 || status === "UNAUTHENTICATED") {
    return {
      title: "Authentication Error",
      message: "Your API credentials are invalid or have expired.",
      action: "Please check your API key configuration and try again.",
      icon: "🔒",
    };
  }

  if (code === 400 || status === "INVALID_ARGUMENT") {
    return {
      title: "Invalid Request",
      message: apiError.message || "The request was invalid.",
      action: "Please check your input and try again.",
      icon: "❌",
    };
  }

  if (code === 500 || status === "INTERNAL") {
    return {
      title: "Server Error",
      message: "An internal server error occurred.",
      action: "Please try again later. If the problem persists, contact support.",
      icon: "🔧",
    };
  }

  // Handle network errors
  if (apiError.message.toLowerCase().includes("network") || 
      apiError.message.toLowerCase().includes("fetch")) {
    return {
      title: "Network Error",
      message: "Unable to connect to the service.",
      action: "Please check your internet connection and try again.",
      icon: "📡",
    };
  }

  // Handle timeout errors
  if (apiError.message.toLowerCase().includes("timeout")) {
    return {
      title: "Request Timeout",
      message: "The request took too long to complete.",
      action: "Please try again. The service may be experiencing delays.",
      icon: "⏱️",
    };
  }

  // Default error format
  return {
    title: "Something Went Wrong",
    message: apiError.message || "An unexpected error occurred.",
    action: "Please try again. If the problem persists, contact support.",
    icon: "⚠️",
  };
}


