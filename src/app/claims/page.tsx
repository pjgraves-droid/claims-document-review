"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, ClaimStatusBadge, PageHeader, formatDate, formatMoney } from "@/components/ui";

export default function ClaimsPage() {
  const { state } = useStore();
  const claims = state.claims.filter((c) => c.policyholder === state.currentUser.policyholder);

  return (
    <div>
      <PageHeader title="My claims" subtitle={`Claims for ${state.currentUser.policyholder}`} />
      <Card>
        <ul className="divide-y divide-slate-200">
          {claims.map((c) => {
            const docs = state.documents.filter((d) => d.claimId === c.id && d.status !== "Superseded" && d.status !== "Failed");
            const needsAction = docs.filter((d) => d.status === "Rejected" || d.status === "More Info Required").length;
            return (
              <li key={c.id}>
                <Link href={`/claims/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{c.reference}</span>
                      <span className="text-xs text-slate-500">{c.product} · {c.policyNumber}</span>
                      <ClaimStatusBadge status={c.status} />
                      {needsAction > 0 && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                          {needsAction} document{needsAction > 1 ? "s" : ""} need{needsAction > 1 ? "" : "s"} action
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{c.description}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lodged {formatDate(c.lodgedAt)} · {docs.length} document{docs.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatMoney(c.value)}</div>
                    <div className="text-xs text-slate-500">claim value</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
