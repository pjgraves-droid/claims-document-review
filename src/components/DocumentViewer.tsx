"use client";

import { FileText, ImageOff } from "lucide-react";
import type { ClaimDocument } from "@/lib/types";

export function DocumentViewer({ doc }: { doc: ClaimDocument }) {
  if (!doc.previewUrl) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
        {doc.mime.includes("wordprocessingml") ? <FileText className="h-10 w-10 text-slate-400" /> : <ImageOff className="h-10 w-10 text-slate-400" />}
        <p>Inline preview not available for this file type.</p>
        <p className="text-xs">{doc.filename}</p>
      </div>
    );
  }
  if (doc.previewUrl.startsWith("blob:") && doc.mime === "application/pdf") {
    return (
      <iframe
        src={doc.previewUrl}
        title={`Preview of ${doc.filename}`}
        className="h-[520px] w-full rounded-md border border-slate-200 bg-white"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={doc.previewUrl}
      alt={`${doc.type}: ${doc.filename}`}
      className="max-h-[520px] w-full rounded-md border border-slate-200 bg-white object-contain"
    />
  );
}
