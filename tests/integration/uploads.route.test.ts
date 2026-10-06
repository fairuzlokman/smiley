import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/uploads/route";
import { signSession } from "@/lib/auth/session";
import { listUploadsByUser } from "@/lib/repositories/uploads";
import { createUser } from "@/lib/repositories/users";
import { NoFaceError, type SmileResult } from "@/lib/smile/types";
import { setupTestDatabase } from "./helpers/db";
import { fakeImage, getRequest, multipartRequest, sessionCookie } from "./helpers/request";

// The real analyzer loads TensorFlow, the storage talks to Vercel Blob and the coach calls Gemini.
// All sit behind a small module boundary, so the route is tested with fakes.
const analyze = vi.fn<(image: Buffer) => Promise<SmileResult>>();
const upload = vi.fn();
const generateCoachFeedback = vi.fn<(result: SmileResult) => Promise<string>>();

vi.mock("@/lib/smile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/smile/types")>("@/lib/smile/types");
  return {
    NoFaceError: actual.NoFaceError,
    getAnalyzer: async () => ({ analyze }),
  };
});

vi.mock("@/lib/coach", () => ({
  generateCoachFeedback: (result: SmileResult) => generateCoachFeedback(result),
}));

vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ upload }),
}));

setupTestDatabase();

const happyResult: SmileResult = {
  score: 87,
  label: "Big smile",
  expressions: { neutral: 0.1, happy: 0.87, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0.03 },
  faceCount: 1,
};

async function createSessionFor(email: string) {
  const user = await createUser({ email, passwordHash: "irrelevant" });
  const token = await signSession({ userId: user.id, email: user.email });
  return { user, cookie: sessionCookie(token) };
}

beforeEach(() => {
  analyze.mockReset();
  upload.mockReset();
  generateCoachFeedback.mockReset();
  analyze.mockResolvedValue(happyResult);
  generateCoachFeedback.mockResolvedValue("Great smile! Keep it up.");
  upload.mockResolvedValue({
    url: "https://blob.example.com/uploads/photo.jpg",
    pathname: "uploads/photo.jpg",
  });
});

describe("POST /api/uploads", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage() }));
    expect(res.status).toBe(401);
    expect(analyze).not.toHaveBeenCalled();
  });

  it("returns 401 for a tampered session cookie", async () => {
    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage() }, sessionCookie("garbage")));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no image field is sent", async () => {
    const { cookie } = await createSessionFor("a@example.com");
    const res = await POST(multipartRequest("/api/uploads", { note: "hello" }, cookie));
    expect(res.status).toBe(400);
    expect(analyze).not.toHaveBeenCalled();
  });

  it("returns 400 for an unsupported type or oversized image", async () => {
    const { cookie } = await createSessionFor("a@example.com");

    const gif = await POST(multipartRequest("/api/uploads", { image: fakeImage("image/gif") }, cookie));
    expect(gif.status).toBe(400);

    const huge = await POST(
      multipartRequest("/api/uploads", { image: fakeImage("image/jpeg", 4 * 1024 * 1024 + 1) }, cookie),
    );
    expect(huge.status).toBe(400);
    expect((await huge.json()).error).toMatch(/4 MB/);

    expect(analyze).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 422 and stores nothing when no face is detected", async () => {
    analyze.mockRejectedValueOnce(new NoFaceError());
    const { user, cookie } = await createSessionFor("a@example.com");

    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage() }, cookie));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/no face/i);

    expect(upload).not.toHaveBeenCalled();
    expect(generateCoachFeedback).not.toHaveBeenCalled(); // no tokens spent on rejected photos
    expect(await listUploadsByUser(user.id)).toHaveLength(0);
  });

  it("analyzes, stores and persists the upload on the happy path", async () => {
    const { user, cookie } = await createSessionFor("a@example.com");

    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage("image/png", 2048) }, cookie));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.upload).toMatchObject({
      score: 87,
      label: "Big smile",
      imageUrl: "https://blob.example.com/uploads/photo.jpg",
      expressions: happyResult.expressions,
      coach: "Great smile! Keep it up.",
    });
    expect(body.faceCount).toBe(1);
    expect(generateCoachFeedback).toHaveBeenCalledWith(happyResult);

    expect(analyze).toHaveBeenCalledTimes(1);
    expect(Buffer.isBuffer(analyze.mock.calls[0][0])).toBe(true);
    expect(upload).toHaveBeenCalledWith(expect.any(Buffer), {
      contentType: "image/png",
      userId: user.id,
    });

    const rows = await listUploadsByUser(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe(87);
    expect(rows[0].blobPathname).toBe("uploads/photo.jpg");
    expect(rows[0].coach).toBe("Great smile! Keep it up.");
  });

  it("still saves the upload, without coach feedback, when the coach fails", async () => {
    generateCoachFeedback.mockRejectedValueOnce(new Error("Gemini is down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { user, cookie } = await createSessionFor("a@example.com");

    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage() }, cookie));
    expect(res.status).toBe(201);
    expect((await res.json()).upload).toMatchObject({ score: 87, coach: null });

    const rows = await listUploadsByUser(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].coach).toBeNull();
    warn.mockRestore();
  });

  it("returns 500 without leaking details when the analyzer crashes", async () => {
    analyze.mockRejectedValueOnce(new Error("tensor exploded"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cookie } = await createSessionFor("a@example.com");

    const res = await POST(multipartRequest("/api/uploads", { image: fakeImage() }, cookie));
    expect(res.status).toBe(500);
    expect((await res.json()).error).not.toMatch(/tensor/);
    expect(upload).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("GET /api/uploads", () => {
  it("returns 401 without a session", async () => {
    const res = await GET(getRequest("/api/uploads"));
    expect(res.status).toBe(401);
  });

  it("returns only the current user's uploads, newest first", async () => {
    const alice = await createSessionFor("alice@example.com");
    const bob = await createSessionFor("bob@example.com");

    analyze.mockResolvedValueOnce({ ...happyResult, score: 10, label: "Not smiling" });
    await POST(multipartRequest("/api/uploads", { image: fakeImage() }, alice.cookie));
    analyze.mockResolvedValueOnce({ ...happyResult, score: 95 });
    await POST(multipartRequest("/api/uploads", { image: fakeImage() }, alice.cookie));
    await POST(multipartRequest("/api/uploads", { image: fakeImage() }, bob.cookie));

    const res = await GET(getRequest("/api/uploads", alice.cookie));
    expect(res.status).toBe(200);
    const { uploads } = await res.json();
    expect(uploads).toHaveLength(2);
    expect(uploads.map((u: { score: number }) => u.score)).toEqual([95, 10]);
    expect(uploads[0]).toHaveProperty("createdAt");
    expect(uploads[0]).not.toHaveProperty("userId");
  });
});
