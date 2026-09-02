"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { DOCUMENT_TYPES, type ClaimDocument, type DocumentType } from "@/lib/types";
import { formatBytes, scanFile, validateFile } from "@/lib/validation";
import { Button } from "./ui";

interface Props {
  claimId: string;
  replacing?: ClaimDocument;
  onClose: () => void;
}

type Phase = "idle" | "validating" | "scanning" | "done" | "failed";

export function UploadDialog({ claimId, replacing, onClose }: Props) {
  const { beginUpload, failUpload, completeUpload } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DocumentType>(replacing?.type ?? "Invoice");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pick = (f: File | null) => {
    setFile(f);
    setError(null);
    setPhase("idle");
    if (f) {
      const v = validateFile(f);
      if (!v.ok) setError(v.reason!);
    }
  };

  const submit = async () => {
    if (!file) return;
    setPhase("validating");
    const v = validateFile(file);
    if (!v.ok) {
      setError(v.reason!);
      setPhase("failed");
      return;
    }
    const previewUrl = file.type.startsWith("image/") || file.type === "application/pdf" ? URL.createObjectURL(file) : undefined;
    const doc = beginUpload({ claimId, type, file, previousVersionId: replacing?.id, previewUrl });
    setPhase("scanning");
    const scan = await scanFile(file);
    if (!scan.ok) {
      failUpload(doc.id, scan.reason!);
      setError(scan.reason!);
      setPhase("failed");
      return;
    }
    completeUpload(doc.id);
    setPhase("done");
    setTimeout(onClose, 900);
  };

  const busy = phase === "validating" || phase === "scanning";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="upload-title" className="text-lg font-semibold">
            {replacing ? `Upload replacement for v${replacing.version}` : "Upload document"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {replacing && (
            <p className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800">
              Replacing <strong>{replacing.filename}</strong> ({replacing.status}). The new file will be linked as
              version {replacing.version + 1} and the original will be marked Superseded.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="doc-type">
              Document type
            </label>
            <select
              id="doc-type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              disabled={busy || !!replacing}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-slate-50"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">File</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="mt-1 flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 hover:border-accent hover:bg-slate-50"
            >
              <UploadCloud className="h-8 w-8 text-slate-400" />
              {file ? (
                <span className="font-medium text-slate-800">
                  {file.name} <span className="font-normal text-slate-500">({formatBytes(file.size)})</span>
                </span>
              ) : (
                <span>Click to choose a file</span>
              )}
              <span className="text-xs text-slate-400">PDF, JPG, PNG or DOCX · max 20 MB · scanned for malware</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Upload rejected</p>
                <p>{error}</p>
                <p className="mt-1 text-xs text-red-600">No document has been attached to the claim.</p>
              </div>
            </div>
          )}

          {phase === "scanning" && (
            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading and running malware scan…
            </div>
          )}
          {phase === "done" && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Uploaded — now Pending Review and routed to an assessor.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!file || !!error || busy || phase === "done"}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
