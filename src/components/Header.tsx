"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, ClipboardList, FileText, RotateCcw, ScrollText, ShieldCheck, User } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export function Header() {
  const { state, setRole, reset } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const unread = state.notifications.filter((n) => n.channel === "in-app" && !n.read).length;

  const nav =
    state.role === "policyholder"
      ? [
          { href: "/claims", label: "My claims", icon: FileText },
          { href: "/notifications", label: "Notifications", icon: Bell, badge: unread },
        ]
      : [
          { href: "/queue", label: "Work queue", icon: ClipboardList },
          { href: "/audit", label: "Audit log", icon: ScrollText },
        ];

  const switchRole = (role: Role) => {
    setRole(role);
    router.push(role === "policyholder" ? "/claims" : "/queue");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-brand">
            <ShieldCheck className="h-6 w-6" />
            <span>Meridian Insurance</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                  pathname.startsWith(href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge ? (
                  <span className="ml-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-slate-300 p-0.5 text-xs font-medium">
            {(["policyholder", "assessor"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={clsx(
                  "rounded px-3 py-1 capitalize",
                  state.role === r ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="hidden items-center gap-1.5 text-sm text-slate-600 sm:flex">
            <User className="h-4 w-4" />
            {state.role === "policyholder" ? state.currentUser.policyholder : state.currentUser.assessor}
          </span>
          <button
            onClick={reset}
            title="Reset demo data"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
