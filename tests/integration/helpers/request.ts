import { SESSION_COOKIE } from "@/lib/auth/session";

const BASE = "http://localhost/";

export function jsonRequest(path: string, body: unknown, cookie?: string): Request {
  return new Request(new URL(path, BASE), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function multipartRequest(
  path: string,
  fields: Record<string, string | Blob>,
  cookie?: string,
): Request {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new Request(new URL(path, BASE), {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: form,
  });
}

export function getRequest(path: string, cookie?: string): Request {
  return new Request(new URL(path, BASE), {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
}

/** Turns a Set-Cookie header from a response into a Cookie header for the next request. */
export function cookieFrom(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) throw new Error("Response has no set-cookie header");
  const [pair] = setCookie.split(";");
  return pair;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}`;
}

export function fakeImage(type = "image/jpeg", bytes = 1024): File {
  return new File([new Uint8Array(bytes)], `photo.${type.split("/")[1]}`, { type });
}
