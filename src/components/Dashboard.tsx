"use client";

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

  function handleUploaded(upload: UploadDto) {
    setLatest(upload);
    setUploads((prev) => [upload, ...prev]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card aria-labelledby="upload-heading">
        <UploadForm onUploaded={handleUploaded} />
      </Card>

      {latest && (
        <Card aria-live="polite">
          <ScoreCard upload={latest} />
        </Card>
      )}

      <section aria-labelledby="history-heading" className="flex flex-col gap-4">
        <h2 id="history-heading" className="text-lg font-bold">
          Your uploads
        </h2>
        <UploadHistory uploads={uploads} />
      </section>
    </div>
  );
}
