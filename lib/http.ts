import { NextResponse } from "next/server";

interface ErrorOptions {
  code: string;
  message: string;
  status: number;
  details?: unknown[];
}

export function errorResponse({ code, message, status, details = [] }: ErrorOptions) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function validationError(message: string, details: unknown[] = []) {
  return errorResponse({
    code: "VALIDATION_ERROR",
    message,
    status: 422,
    details,
  });
}

export function notFound(message: string) {
  return errorResponse({
    code: "NOT_FOUND",
    message,
    status: 404,
  });
}

export function serverError(message: string) {
  return errorResponse({
    code: "SERVER_ERROR",
    message,
    status: 500,
  });
}
