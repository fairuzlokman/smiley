import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These rely on Node APIs / WASM files and must not be bundled.
  serverExternalPackages: [
    "@vladmandic/face-api",
    "@tensorflow/tfjs",
    "@tensorflow/tfjs-backend-wasm",
    "sharp",
  ],
  // Files the upload route reads from disk at runtime, so Vercel ships them with the function.
  outputFileTracingIncludes: {
    "/api/uploads": ["./weights/**/*", "./node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
