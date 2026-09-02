"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { AuditAction } from "@/lib/types";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";

const ACTION_LABELS: Record<AuditAction, string> = {
  DOCUMENT_UPLOADED: "Upload",
  DOCUMENT_REJECTED_BY_VALIDATION: "Upload rejected",
  DOCUMENT_VIEWED: "View",
  DOCUMENT_DECISION: "Decision",
  DOCUMENT_SUPERSEDED: "Superseded",
  CLAIM_QUEUED: "Queued",
  CLAIM_STATUS_CHANGED: "Status change",
  NOTIFICATION_SENT: "Notification",
};

export default function AuditPage() {
  const { state } = useStore();
  const [claimFilter, setClaimFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const rows = state.audit.filter(
    (a) => (claimFilter === "all" || a.claimId === claimFilter) && (actionFilter === "all" || a.action === actionFilter),
  );

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Immutable record of every upload, view, decision and notification — actor, timestamp, action, document version and reason"
        action={
          <div className="flex gap-2">
            <select value={claimFilter} onChange={(e) => setClaimFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              <option value="all">All claims</option>
              {state.claims.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.reference}
                </option>
              ))}
            </select>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              <option value="all">All actions</option>
              {(Object.keys(ACTION_LABELS) as AuditAction[]).map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>No audit events match the filters.</EmptyState>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-3 py-3">Actor</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Claim</th>
                <th className="px-3 py-3">Doc / version</th>
                <th className="px-3 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((a) => {
                const claim = state.claims.find((c) => c.id === a.claimId);
                const doc = state.documents.find((d) => d.id === a.documentId);
                return (
                  <tr key={a.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{formatDateTime(a.at)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800">{a.actor}</div>
                      <div className="text-xs capitalize text-slate-400">{a.role}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{ACTION_LABELS[a.action]}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {claim ? (
                        <Link href={`/queue/${claim.id}`} className="text-qbe-blue hover:underline">
                          {claim.reference}
                        </Link>
                      ) : (
                        a.claimId
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {doc ? (
                        <>
                          <div className="max-w-[180px] truncate" title={doc.filename}>{doc.filename}</div>
                          {a.version && <div className="text-slate-400">v{a.version}</div>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {a.detail}
                      {a.reason && <div className="mt-0.5 text-xs text-slate-500">Reason: {a.reason}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
