"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, History, RefreshCw, Upload } from "lucide-react";
import { documentsForClaim, useStore, versionChain } from "@/lib/store";
import type { ClaimDocument } from "@/lib/types";
import { UploadDialog } from "@/components/UploadDialog";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  Button,
  Card,
  ClaimStatusBadge,
  DocStatusBadge,
  EmptyState,
  PageHeader,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/components/ui";
import { formatBytes } from "@/lib/validation";

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();
  const [upload, setUpload] = useState<{ open: boolean; replacing?: ClaimDocument }>({ open: false });
  const [preview, setPreview] = useState<ClaimDocument | null>(null);

  const claim = state.claims.find((c) => c.id === id);
  if (!claim) return <EmptyState>Claim not found.</EmptyState>;

  const docs = documentsForClaim(state, claim.id);
  const visible = docs.filter((d) => d.status !== "Superseded");
  const canUpload = claim.status === "Open" || claim.status === "Information Requested" || claim.status === "Under Assessment";
  const notifications = state.notifications.filter((n) => n.claimId === claim.id && n.channel === "in-app");

  return (
    <div>
      <Link href="/claims" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> My claims
      </Link>
      <PageHeader
        title={claim.reference}
        subtitle={claim.description}
        action={
          <Button onClick={() => setUpload({ open: true })} disabled={!canUpload} title={canUpload ? undefined : "Documents can only be uploaded to open claims"}>
            <Upload className="h-4 w-4" /> Upload document
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold">Documents</h2>
              <span className="text-xs text-slate-500">{visible.length} active</span>
            </div>
            {visible.length === 0 ? (
              <div className="p-5">
                <EmptyState>No documents yet. Upload an invoice, estimate, photo or medical report to progress your claim.</EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {visible.map((d) => {
                  const chain = versionChain(state, d);
                  const canResubmit = d.status === "Rejected" || d.status === "More Info Required";
                  return (
                    <li key={d.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{d.filename}</span>
                            <DocStatusBadge status={d.status} />
                            {d.version > 1 && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                <History className="h-3 w-3" /> v{d.version}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {d.type} · {formatBytes(d.size)} · uploaded {formatDateTime(d.uploadedAt)}
                          </p>
                          {d.status === "Failed" && d.failureReason && (
                            <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{d.failureReason}</p>
                          )}
                          {d.decision && (
                            <div className="mt-2 rounded bg-slate-50 px-3 py-2 text-sm">
                              <p className="text-slate-700">
                                <span className="font-medium">{d.decision.outcome}</span> by {d.decision.actor} on{" "}
                                {formatDateTime(d.decision.decidedAt)}
                              </p>
                              {d.decision.reasonCode && (
                                <p className="text-slate-600">Reason code: {d.decision.reasonCode}</p>
                              )}
                              {d.decision.note && <p className="text-slate-600">{d.decision.note}</p>}
                            </div>
                          )}
                          {chain.length > 1 && (
                            <p className="mt-2 text-xs text-slate-500">
                              Previous versions:{" "}
                              {chain
                                .slice(1)
                                .map((p) => `v${p.version} (${p.filename}, ${p.status})`)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {d.status !== "Failed" && (
                            <Button variant="secondary" onClick={() => setPreview(d)}>
                              <Eye className="h-4 w-4" /> View
                            </Button>
                          )}
                          {canResubmit && (
                            <Button onClick={() => setUpload({ open: true, replacing: d })}>
                              <RefreshCw className="h-4 w-4" /> Upload replacement
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {preview && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  {preview.filename} <span className="text-xs font-normal text-slate-500">v{preview.version}</span>
                </h3>
                <Button variant="ghost" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
              <DocumentViewer doc={preview} />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Claim details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Status">
                <ClaimStatusBadge status={claim.status} />
              </Row>
              <Row label="Product">{claim.product}</Row>
              <Row label="Policy">{claim.policyNumber}</Row>
              <Row label="Claim value">{formatMoney(claim.value)}</Row>
              <Row label="Lodged">{formatDate(claim.lodgedAt)}</Row>
            </dl>
          </Card>

          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold">Updates</h2>
            </div>
            {notifications.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No updates yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {notifications.map((n) => (
                  <li key={n.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-slate-900">{n.subject}</p>
                    <p className="mt-0.5 text-slate-600">{n.body}</p>
                    {n.nextAction && <p className="mt-1 text-orange-800">Next step: {n.nextAction}</p>}
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {upload.open && (
        <UploadDialog claimId={claim.id} replacing={upload.replacing} onClose={() => setUpload({ open: false })} />
      )}
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
