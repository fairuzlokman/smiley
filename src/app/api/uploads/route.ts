import { getUserFromRequest } from "@/lib/auth/currentUser";
import { ApiError, json, jsonError } from "@/lib/http";
import { createUpload, listUploadsByUser } from "@/lib/repositories/uploads";
import { getAnalyzer, NoFaceError } from "@/lib/smile";
import { getStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/validation/upload";

// Face detection needs Node APIs (sharp, fs) and can take a few seconds on a cold start.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw new ApiError(401, "Please log in to upload a photo.");

    const file = await readImageFile(request);
    const validation = validateImageFile(file);
    if (!validation.ok) throw new ApiError(400, validation.message);
    const image = Buffer.from(await file.arrayBuffer());

    // Analyze first: a photo with no face should never reach storage or the DB.
    const analyzer = await getAnalyzer();
    let result;
    try {
      result = await analyzer.analyze(image);
    } catch (err) {
      if (err instanceof NoFaceError) throw new ApiError(422, err.message);
      throw err;
    }

    const stored = await getStorage().upload(image, {
      contentType: file.type,
      userId: user.userId,
    });

    const upload = await createUpload({
      userId: user.userId,
      imageUrl: stored.url,
      blobPathname: stored.pathname,
      score: result.score,
      label: result.label,
      expressions: result.expressions,
    });

    return json({ upload: toDto(upload), faceCount: result.faceCount }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw new ApiError(401, "Please log in to see your uploads.");

    const rows = await listUploadsByUser(user.userId);
    return json({ uploads: rows.map(toDto) });
  } catch (err) {
    return jsonError(err);
  }
}

async function readImageFile(request: Request): Promise<File> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "Expected a multipart form with an 'image' field.");
  }
  const file = form.get("image");
  if (!(file instanceof File)) {
    throw new ApiError(400, "Choose an image to upload.");
  }
  return file;
}

export type UploadDto = {
  id: string;
  imageUrl: string;
  score: number;
  label: string;
  expressions: Record<string, number>;
  createdAt: string;
};

function toDto(row: {
  id: string;
  imageUrl: string;
  score: number;
  label: string;
  expressions: string;
  createdAt: Date;
}): UploadDto {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    score: row.score,
    label: row.label,
    expressions: JSON.parse(row.expressions),
    createdAt: row.createdAt.toISOString(),
  };
}
