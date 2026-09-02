"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, ClipboardList, FileText, RotateCcw, ScrollText, User } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

function QbeLogo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <path d="M20 3 L37 33 H3 Z" fill="none" stroke="#5FB9EF" strokeWidth="5" strokeLinejoin="round" />
        <path d="M20 13 L28.5 28 H11.5 Z" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinejoin="round" />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-white">QBE</span>
    </span>
  );
}

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
    <header className="bg-qbe-navy text-white">
      <div className="mx-auto flex max-w-6xl items-stretch justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="py-3">
            <QbeLogo />
          </Link>
          <nav className="flex items-stretch">
            {nav.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative flex items-center gap-1.5 px-4 text-sm font-medium transition hover:bg-white/10",
                  pathname.startsWith(href) ? "shadow-[inset_0_-3px_0_0_#F9760A]" : "",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge ? (
                  <span className="ml-1 rounded-full bg-qbe-orange px-1.5 text-[10px] font-bold text-white">{badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-stretch">
          <div className="flex items-center gap-3 px-4">
            <div className="flex rounded-pill border border-white/30 p-0.5 text-xs font-medium">
              {(["policyholder", "assessor"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={clsx(
                    "rounded-pill px-3 py-1 capitalize transition",
                    state.role === r ? "bg-white text-qbe-navy" : "text-white/80 hover:bg-white/10",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              title="Reset demo data"
              className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="hidden items-center gap-2 bg-qbe-blue px-5 text-sm font-medium sm:flex">
            <User className="h-4 w-4" />
            {state.role === "policyholder" ? state.currentUser.policyholder : state.currentUser.assessor}
          </div>
        </div>
      </div>
    </header>
  );
}
