import path from "node:path";
import sharp from "sharp";
import * as tf from "@tensorflow/tfjs";
// Registers the "wasm" backend with the tfjs instance above (face-api requires the same packages).
import "@tensorflow/tfjs-backend-wasm";
import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import { scoreFaces, type DetectedFace } from "./score";
import type { SmileAnalyzer, SmileResult } from "./types";

const WEIGHTS_DIR = path.join(process.cwd(), "weights");
/** Downscale before inference: faster and the tiny detector doesn't benefit from more pixels. */
const MAX_INPUT_WIDTH = 640;

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.4,
});

// One init per process: model weights and the TF backend are shared across requests.
let initPromise: Promise<void> | undefined;

async function init() {
  try {
    await tf.setBackend("wasm");
  } catch (err) {
    console.warn("WASM backend unavailable, falling back to CPU:", err);
    await tf.setBackend("cpu");
  }
  await tf.ready();
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(WEIGHTS_DIR),
    faceapi.nets.faceExpressionNet.loadFromDisk(WEIGHTS_DIR),
  ]);
}

export function ensureFaceApiReady(): Promise<void> {
  if (!initPromise) {
    initPromise = init().catch((err) => {
      initPromise = undefined; // let the next request retry
      throw err;
    });
  }
  return initPromise;
}

/** Decodes any supported image into an RGB tensor the models can consume. */
async function toTensor(image: Buffer) {
  const { data, info } = await sharp(image)
    .rotate() // honour EXIF orientation from phone cameras
    .resize({ width: MAX_INPUT_WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Created through face-api's tf export so the tensor type matches its API signatures.
  return faceapi.tf.tensor3d(
    new Uint8Array(data.buffer, data.byteOffset, data.length),
    [info.height, info.width, 3],
    "int32",
  );
}

export class FaceApiAnalyzer implements SmileAnalyzer {
  async analyze(image: Buffer): Promise<SmileResult> {
    await ensureFaceApiReady();
    const tensor = await toTensor(image);
    try {
      const detections = await faceapi
        .detectAllFaces(tensor, detectorOptions)
        .withFaceExpressions();

      const faces: DetectedFace[] = detections.map((d) => ({
        box: { width: d.detection.box.width, height: d.detection.box.height },
        expressions: {
          neutral: d.expressions.neutral,
          happy: d.expressions.happy,
          sad: d.expressions.sad,
          angry: d.expressions.angry,
          fearful: d.expressions.fearful,
          disgusted: d.expressions.disgusted,
          surprised: d.expressions.surprised,
        },
      }));
      return scoreFaces(faces);
    } finally {
      tensor.dispose();
    }
  }

  backendName(): string {
    return tf.getBackend();
  }
}
