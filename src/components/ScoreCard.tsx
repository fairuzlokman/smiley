import { Sparkles } from "lucide-react";
import type { UploadDto } from "@/app/api/uploads/route";

type Props = {
  upload: UploadDto;
  heading?: string;
};

/** Score, label, a bar and the coach's feedback. The label text carries the meaning so colour is never the only cue. */
export function ScoreCard({ upload, heading = "Your smile score" }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative aspect-square w-full max-w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Blob URL, sized by the container */}
          <img
            src={upload.imageUrl}
            alt={`Photo scored ${upload.score} out of 100, ${upload.label.toLowerCase()}`}
            className="size-full object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 className="text-lg font-bold">{heading}</h2>
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-5xl tabular-nums text-heading">{upload.score}</span>
            <span className="text-muted-foreground">/ 100</span>
          </p>
          <p className="text-base font-semibold text-foreground">{upload.label}</p>
          <div
            role="progressbar"
            aria-label="Smile score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={upload.score}
            aria-valuetext={`${upload.score} out of 100, ${upload.label}`}
            className="h-3 w-full overflow-hidden rounded-full bg-primary-soft"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${upload.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Absent when the coach was unavailable: the score stands on its own. Rendered as text, never HTML. */}
      {upload.coach && (
        <div className="flex gap-3 rounded-lg bg-primary-soft/60 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-bold text-heading">Coach</p>
            <p className="text-foreground">{upload.coach}</p>
          </div>
        </div>
      )}
    </div>
  );
}
