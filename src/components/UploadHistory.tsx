import { ImageIcon } from "lucide-react";
import type { UploadDto } from "@/app/api/uploads/route";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function UploadHistory({ uploads }: { uploads: UploadDto[] }) {
  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
        <ImageIcon className="size-8 text-secondary" aria-hidden="true" />
        <p className="font-semibold text-heading">No uploads yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add your first photo above and your scores will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {uploads.map((upload) => (
        <li
          key={upload.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card"
        >
          <div className="relative aspect-square bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Blob URL, sized by the container */}
            <img
              src={upload.imageUrl}
              alt={`Photo scored ${upload.score} out of 100`}
              loading="lazy"
              className="size-full object-cover"
            />
            <span className="absolute right-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-sm font-bold tabular-nums text-heading shadow-sm">
              {upload.score}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 p-3">
            <p className="text-sm font-semibold text-foreground">{upload.label}</p>
            <time
              dateTime={upload.createdAt}
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {dateFormat.format(new Date(upload.createdAt))}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
