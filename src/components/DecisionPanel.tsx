"use client";

import { useState } from "react";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { REJECTION_REASON_CODES, type ClaimDocument, type DecisionOutcome, type RejectionReasonCode } from "@/lib/types";
import { Button } from "./ui";

export function DecisionPanel({ doc, onDecided }: { doc: ClaimDocument; onDecided?: () => void }) {
  const { recordDecision } = useStore();
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);
  const [reasonCode, setReasonCode] = useState<RejectionReasonCode | "">("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  const needsReason = outcome === "Rejected";
  const needsNote = outcome === "Rejected" || outcome === "More Info Required";
  const valid =
    outcome !== null && (!needsReason || reasonCode !== "") && (!needsNote || note.trim().length > 0);

  const submit = () => {
    setTouched(true);
    if (!valid || !outcome) return;
    recordDecision(doc.id, {
      outcome,
      reasonCode: outcome === "Rejected" && reasonCode ? reasonCode : undefined,
      note: note.trim() || undefined,
    });
    onDecided?.();
  };

  const options: { value: DecisionOutcome; icon: typeof CheckCircle2; style: string; hint: string }[] = [
    { value: "Accepted", icon: CheckCircle2, style: "border-emerald-500 bg-emerald-50 text-emerald-800", hint: "Document verified" },
    { value: "Rejected", icon: XCircle, style: "border-red-500 bg-red-50 text-red-800", hint: "Reason code + note required" },
    { value: "More Info Required", icon: HelpCircle, style: "border-orange-500 bg-orange-50 text-orange-800", hint: "Specify what is needed" },
  ];

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Decision</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map(({ value, icon: Icon, style, hint }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOutcome(value)}
              aria-pressed={outcome === value}
              className={clsx(
                "flex flex-col items-start gap-1 rounded-md border-2 px-3 py-2 text-left text-sm transition",
                outcome === value ? style : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Icon className="h-4 w-4" /> {value}
              </span>
              <span className="text-xs opacity-75">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {needsReason && (
        <div>
          <label htmlFor="reason-code" className="block text-sm font-medium text-slate-700">
            Reason code <span className="text-red-600">*</span>
          </label>
          <select
            id="reason-code"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as RejectionReasonCode)}
            className={clsx(
              "mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent",
              touched && !reasonCode ? "border-red-400" : "border-slate-300",
            )}
          >
            <option value="">Select a reason…</option>
            {REJECTION_REASON_CODES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {outcome && (
        <div>
          <label htmlFor="decision-note" className="block text-sm font-medium text-slate-700">
            {outcome === "More Info Required" ? "What is needed from the policyholder" : "Note to policyholder"}{" "}
            {needsNote && <span className="text-red-600">*</span>}
          </label>
          <textarea
            id="decision-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              outcome === "More Info Required"
                ? "e.g. Please provide an itemised invoice showing labour and parts separately."
                : outcome === "Rejected"
                  ? "Explain the rejection in plain language."
                  : "Optional"
            }
            className={clsx(
              "mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent",
              touched && needsNote && !note.trim() ? "border-red-400" : "border-slate-300",
            )}
          />
          {touched && !valid && (
            <p className="mt-1 text-xs text-red-600">Complete the required fields before saving the decision.</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!outcome} variant={outcome === "Rejected" ? "danger" : "primary"}>
          Save decision &amp; notify policyholder
        </Button>
      </div>
    </div>
  );
}
