import { NextResponse } from "next/server";

/**
 * Error that carries an HTTP status. Thrown from lib code, turned into a JSON
 * response by `jsonError` in route handlers so each handler stays small.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }
  console.error("Unhandled error in route handler:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
