"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import clsx from "clsx";
import { documentsForClaim, priorityBand, priorityScore, useStore, versionChain } from "@/lib/store";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DecisionPanel } from "@/components/DecisionPanel";
import {
  Card,
  ClaimStatusBadge,
  DocStatusBadge,
  EmptyState,
  PageHeader,
  PriorityBadge,
  SlaBadge,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/components/ui";
import { formatBytes } from "@/lib/validation";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { state, viewDocument } = useStore();
  const claim = state.claims.find((c) => c.id === id);
  const docs = useMemo(() => (claim ? documentsForClaim(state, claim.id) : []), [state, claim]);
  const pending = docs.filter((d) => d.status === "Pending Review");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = docs.find((d) => d.id === selectedId) ?? pending[0] ?? docs.find((d) => d.status !== "Superseded") ?? null;

  useEffect(() => {
    if (selected) viewDocument(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  if (!claim) return <EmptyState>Claim not found.</EmptyState>;

  const score = priorityScore(claim, state.documents);
  const claimAudit = state.audit.filter((a) => a.claimId === claim.id).slice(0, 8);

  return (
    <div>
      <Link href="/queue" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Work queue
      </Link>
      <PageHeader
        title={`Review ${claim.reference}`}
        subtitle={claim.description}
        action={
          <div className="flex items-center gap-2">
            <PriorityBadge band={priorityBand(score)} />
            <SlaBadge due={claim.slaDueAt} />
            <ClaimStatusBadge status={claim.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: document list */}
        <div className="space-y-6">
          <Card>
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold">Documents</h2>
              <p className="text-xs text-slate-500">{pending.length} pending review</p>
            </div>
            <ul className="divide-y divide-slate-200">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={clsx(
                      "w-full px-4 py-3 text-left hover:bg-slate-50",
                      selected?.id === d.id && "bg-sky-50 ring-1 ring-inset ring-sky-200",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">{d.filename}</span>
                      {d.version > 1 && <span className="text-xs text-slate-500">v{d.version}</span>}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{d.type}</span>
                      <DocStatusBadge status={d.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Claim details</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Policyholder">{claim.policyholder}</Row>
              <Row label="Policy">{claim.policyNumber}</Row>
              <Row label="Product">{claim.product}</Row>
              <Row label="Claim value">{formatMoney(claim.value)}</Row>
              <Row label="Lodged">{formatDate(claim.lodgedAt)}</Row>
              <Row label="Queued">{claim.queuedAt ? formatDateTime(claim.queuedAt) : "—"}</Row>
              <Row label="SLA due">{claim.slaDueAt ? formatDateTime(claim.slaDueAt) : "—"}</Row>
              <Row label="Priority score">{score}</Row>
            </dl>
          </Card>
        </div>

        {/* Right: viewer + decision */}
        <div className="space-y-6 lg:col-span-2">
          {selected ? (
            <>
              <Card className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{selected.filename}</h3>
                    <p className="text-xs text-slate-500">
                      {selected.type} · {formatBytes(selected.size)} · v{selected.version} · uploaded{" "}
                      {formatDateTime(selected.uploadedAt)} by {selected.uploadedBy}
                    </p>
                  </div>
                  <DocStatusBadge status={selected.status} />
                </div>
                <DocumentViewer doc={selected} />
                {versionChain(state, selected).length > 1 && (
                  <div className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <History className="h-3 w-3" /> Version history
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {versionChain(state, selected).map((v) => (
                        <li key={v.id}>
                          v{v.version} — {v.filename} · {v.status}
                          {v.decision?.note ? ` · "${v.decision.note}"` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                {selected.status === "Pending Review" ? (
                  <DecisionPanel key={selected.id} doc={selected} onDecided={() => setSelectedId(null)} />
                ) : selected.decision ? (
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">Decision recorded: {selected.decision.outcome}</p>
                    <p className="text-slate-600">
                      by {selected.decision.actor} on {formatDateTime(selected.decision.decidedAt)}
                    </p>
                    {selected.decision.reasonCode && <p className="mt-1 text-slate-600">Reason code: {selected.decision.reasonCode}</p>}
                    {selected.decision.note && <p className="mt-1 text-slate-600">{selected.decision.note}</p>}
                    <p className="mt-2 text-xs text-slate-400">Documents are immutable once decided — corrections arrive as a new version.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No decision required for this document ({selected.status}).</p>
                )}
              </Card>
            </>
          ) : (
            <EmptyState>No documents on this claim.</EmptyState>
          )}

          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold">Recent activity</h2>
            </div>
            <ul className="divide-y divide-slate-100 text-sm">
              {claimAudit.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-2">
                  <span className="w-28 flex-shrink-0 text-xs text-slate-400">{formatDateTime(a.at)}</span>
                  <span className="text-slate-700">
                    <span className="font-medium">{a.actor}</span> — {a.detail}
                    {a.reason && <span className="text-slate-500"> ({a.reason})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
