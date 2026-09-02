"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, Mail } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";

export default function NotificationsPage() {
  const { state, markNotificationsRead } = useStore();
  const items = state.notifications
    .filter((n) => n.recipient === state.currentUser.policyholder)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  useEffect(() => {
    const t = setTimeout(markNotificationsRead, 1500);
    return () => clearTimeout(t);
  }, [markNotificationsRead]);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="In-app and email notifications sent to you about your claims" />
      {items.length === 0 ? (
        <EmptyState>No notifications yet.</EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-200">
            {items.map((n) => {
              const claim = state.claims.find((c) => c.id === n.claimId);
              return (
                <li key={n.id} className={clsx("flex gap-4 px-5 py-4", !n.read && n.channel === "in-app" && "bg-sky-50/50")}>
                  <div
                    className={clsx(
                      "mt-0.5 rounded-full p-2",
                      n.channel === "email" ? "bg-slate-100 text-slate-600" : "bg-sky-100 text-sky-700",
                    )}
                    title={n.channel === "email" ? "Email" : "In-app"}
                  >
                    {n.channel === "email" ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{n.subject}</p>
                      <span className="text-xs text-slate-400">
                        {n.channel === "email" ? "Email" : "In-app"} · {formatDateTime(n.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                    {n.nextAction && (
                      <p className="mt-1 rounded bg-orange-50 px-2 py-1 text-sm text-orange-800">
                        <strong>Next action:</strong> {n.nextAction}
                      </p>
                    )}
                    {claim && (
                      <Link href={`/claims/${claim.id}`} className="mt-2 inline-block text-sm font-medium text-qbe-blue hover:underline">
                        Open {claim.reference}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
