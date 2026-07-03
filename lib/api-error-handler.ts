import { NextResponse, NextRequest } from "next/server";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorCode?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

/**
 * Unified API error handler
 * Catches, logs, and returns formatted error responses
 */
export function handleAPIError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  console.error(`[v0] API Error (${requestId}):`, error);

  const timestamp = new Date().toISOString();

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorCode: error.errorCode,
        statusCode: error.statusCode,
        timestamp,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
        errorCode: "INVALID_JSON",
        statusCode: 400,
        timestamp,
        requestId,
      },
      { status: 400 }
    );
  }

  if (error instanceof TypeError) {
    return NextResponse.json(
      {
        success: false,
        error: "Type error in request processing",
        errorCode: "TYPE_ERROR",
        statusCode: 500,
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error ? error.message : "Internal server error",
      errorCode: "INTERNAL_ERROR",
      statusCode: 500,
      timestamp,
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T extends Record<string, any>>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    console.log(`[v0] ${request.method} ${request.nextUrl.pathname} - ${requestId}`);

    try {
      const response = await handler(request);
      console.log(
        `[v0] ${request.method} ${request.nextUrl.pathname} - ${response.status} - ${requestId}`
      );
      return response;
    } catch (error) {
      return handleAPIError(error, requestId);
    }
  };
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter((field) => !body[field]);

  if (missing.length > 0) {
    throw new APIError(
      400,
      `Missing required fields: ${missing.join(", ")}`,
      "MISSING_FIELDS"
    );
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError(400, "Invalid email format", "INVALID_EMAIL");
  }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new APIError(
      400,
      "Password must be at least 8 characters",
      "WEAK_PASSWORD"
    );
  }
}
