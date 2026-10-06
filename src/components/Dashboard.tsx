"use client";

import { Smile } from "lucide-react";
import { useState } from "react";
import type { UploadDto } from "@/app/api/uploads/route";
import { ScoreCard } from "./ScoreCard";
import { Card } from "./ui/Card";
import { UploadForm } from "./UploadForm";
import { UploadHistory } from "./UploadHistory";

/** Owns the list so a new upload appears instantly without a full page reload. */
export function Dashboard({ initialUploads }: { initialUploads: UploadDto[] }) {
  const [uploads, setUploads] = useState(initialUploads);
  const [latest, setLatest] = useState<UploadDto | null>(null);
  // Returning users see their most recent result (and its saved coach feedback) straight away.
  const shown = latest ?? uploads[0];

  function handleUploaded(upload: UploadDto) {
    setLatest(upload);
    setUploads((prev) => [upload, ...prev]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Grid items stretch to the tallest one, so both cards are always the same height side by side. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="upload-heading">
          <UploadForm onUploaded={handleUploaded} />
        </Card>

        <Card aria-live="polite">
          {shown ? (
            <ScoreCard upload={shown} heading={latest ? "Your smile score" : "Your latest score"} />
          ) : (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 px-6 py-10 text-center">
              <Smile className="size-8 text-secondary" aria-hidden="true" />
              <p className="font-semibold text-heading">Your score will appear here</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Upload a photo to get your smile score and a tip from the coach.
              </p>
            </div>
          )}
        </Card>
      </div>

      <section aria-labelledby="history-heading" className="flex flex-col gap-4">
        <h2 id="history-heading" className="text-lg font-bold">
          Your uploads
        </h2>
        <UploadHistory uploads={uploads} />
      </section>
    </div>
  );
}
