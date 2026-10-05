"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from "react";
import type { UploadDto } from "@/app/api/uploads/route";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/validation/upload";

type Props = {
  onUploaded: (upload: UploadDto) => void;
};

export function UploadForm({ onUploaded }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);

  // Object URLs leak unless revoked: release the previous one whenever it changes or on unmount.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function choose(candidate: File | undefined) {
    setError(null);
    if (!candidate) return;
    // Same rules as the API, so people hear about problems before waiting on a request.
    const validation = validateImageFile(candidate);
    if (!validation.ok) {
      setFile(null);
      setPreviewUrl(null);
      setError(validation.message);
      return;
    }
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  }

  function clear() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setError(null);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Upload failed. Please try again.");
        return;
      }
      onUploaded(body.upload as UploadDto);
      clear();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">Upload a photo</h2>
        <p className="text-sm text-muted-foreground">
          A clear, front-facing photo works best. We score the biggest face in the picture.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* The drop zone is a convenience; the label/button inside is the real control. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-200 motion-reduce:transition-none " +
          (dragging ? "border-accent bg-primary-soft/60" : "border-border bg-background/60")
        }
      >
        {previewUrl && file ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="relative aspect-square w-full max-w-60 overflow-hidden rounded-xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={previewUrl} alt="Preview of the selected photo" className="size-full object-cover" />
            </div>
            <p className="max-w-full truncate text-sm text-muted-foreground" title={file.name}>
              {file.name}
            </p>
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-heading motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
              Choose a different photo
            </button>
          </div>
        ) : (
          <>
            <ImagePlus className="size-8 text-secondary" aria-hidden="true" />
            <label
              htmlFor={inputId}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-primary bg-card px-5 font-semibold text-heading transition-colors duration-200 hover:bg-primary-soft motion-reduce:transition-none"
            >
              Choose a photo
            </label>
            <p className="text-sm text-muted-foreground">or drag and drop it here</p>
          </>
        )}
        <input
          ref={inputRef}
          id={inputId}
          name="image"
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={(e) => choose(e.target.files?.[0])}
          aria-describedby={`${inputId}-hint`}
          className="sr-only"
        />
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 4 MB.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!file}
        loading={pending}
        loadingText="Analyzing your smile…"
        className="w-full sm:w-auto sm:self-start"
      >
        Get my smile score
      </Button>
    </form>
  );
}
