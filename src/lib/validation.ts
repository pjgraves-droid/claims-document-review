export const MAX_FILE_BYTES = 20 * 1024 * 1024;

const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED[ext]) {
    return {
      ok: false,
      reason: `File type ".${ext || "unknown"}" is not supported. Accepted types: PDF, JPG, PNG, DOCX.`,
    };
  }
  if (file.type && !ALLOWED[ext].includes(file.type)) {
    return {
      ok: false,
      reason: `File contents (${file.type}) do not match the ".${ext}" extension.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `File is ${formatBytes(file.size)}, which exceeds the 20 MB limit.`,
    };
  }
  return { ok: true };
}

/**
 * Simulated malware scan. In the demo, any filename containing
 * "virus", "malware" or "eicar" is treated as infected.
 */
export async function scanFile(file: File): Promise<ValidationResult> {
  await new Promise((r) => setTimeout(r, 900));
  const lower = file.name.toLowerCase();
  if (/virus|malware|eicar/.test(lower)) {
    return {
      ok: false,
      reason: "Malware scan failed: the file was flagged as potentially malicious and has been discarded.",
    };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
