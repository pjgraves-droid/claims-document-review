"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { assessorQueue, priorityBand, useStore } from "@/lib/store";
import { Card, ClaimStatusBadge, EmptyState, PageHeader, PriorityBadge, SlaBadge, formatDate, formatMoney } from "@/components/ui";

export default function QueuePage() {
  const { state } = useStore();
  const queue = assessorQueue(state);
  const overdue = queue.filter((q) => q.claim.slaDueAt && new Date(q.claim.slaDueAt).getTime() < Date.now()).length;

  return (
    <div>
      <PageHeader
        title="Assessor work queue"
        subtitle={`${queue.length} claim${queue.length === 1 ? "" : "s"} with documents pending review · ${overdue} overdue · prioritised by claim value, age and SLA`}
      />
      {queue.length === 0 ? (
        <EmptyState>Queue is empty. Nice work.</EmptyState>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Priority</th>
                <th className="px-3 py-3">Claim</th>
                <th className="px-3 py-3">Policyholder</th>
                <th className="px-3 py-3 text-right">Value</th>
                <th className="px-3 py-3">Age</th>
                <th className="px-3 py-3">Pending</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queue.map(({ claim, pendingCount, score }) => {
                const ageDays = Math.floor((Date.now() - new Date(claim.lodgedAt).getTime()) / 86_400_000);
                return (
                  <tr key={claim.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <PriorityBadge band={priorityBand(score)} />
                        <span className="text-xs text-slate-400" title="Priority score">{score}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/queue/${claim.id}`} className="font-medium text-qbe-blue hover:underline">
                        {claim.reference}
                      </Link>
                      <div className="text-xs text-slate-500">{claim.product}</div>
                      <div className="mt-1">
                        <ClaimStatusBadge status={claim.status} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{claim.policyholder}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatMoney(claim.value)}</td>
                    <td className="px-3 py-3 text-slate-700" title={`Lodged ${formatDate(claim.lodgedAt)}`}>
                      {ageDays}d
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {pendingCount} doc{pendingCount === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <SlaBadge due={claim.slaDueAt} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/queue/${claim.id}`} className="inline-flex text-slate-400 hover:text-slate-700" aria-label={`Review ${claim.reference}`}>
                        <ChevronRight className="h-5 w-5" />
                      </Link>
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
