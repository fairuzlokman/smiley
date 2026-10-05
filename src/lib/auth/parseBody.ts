import type { z } from "zod";
import { ApiError } from "@/lib/http";

/** Parses a JSON request body against a zod schema, mapping failures to a 400 with field errors. */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw new ApiError(400, "Please fix the highlighted fields.", { fieldErrors });
  }
  return result.data;
}
