"use client";

import clsx from "clsx";
import type { ClaimStatus, DocumentStatus } from "@/lib/types";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMoney(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function timeUntil(iso: string) {
  const diffH = (new Date(iso).getTime() - Date.now()) / 3_600_000;
  const abs = Math.abs(diffH);
  const label = abs < 1 ? `${Math.round(abs * 60)}m` : abs < 48 ? `${Math.round(abs)}h` : `${Math.round(abs / 24)}d`;
  return diffH < 0 ? `${label} overdue` : `${label} remaining`;
}

const docStatusStyles: Record<DocumentStatus, string> = {
  Uploading: "bg-slate-100 text-slate-600 animate-pulse",
  Failed: "bg-red-100 text-red-700",
  "Pending Review": "bg-amber-100 text-amber-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-700",
  "More Info Required": "bg-orange-100 text-orange-800",
  Superseded: "bg-slate-100 text-slate-500 line-through",
};

export function DocStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", docStatusStyles[status])}>
      {status}
    </span>
  );
}

const claimStatusStyles: Record<ClaimStatus, string> = {
  Open: "bg-sky-100 text-sky-800",
  "Information Requested": "bg-orange-100 text-orange-800",
  "Under Assessment": "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-100 text-slate-600",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", claimStatusStyles[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ band }: { band: "High" | "Medium" | "Low" }) {
  const styles = {
    High: "bg-red-600 text-white",
    Medium: "bg-amber-500 text-white",
    Low: "bg-slate-400 text-white",
  };
  return <span className={clsx("inline-flex rounded px-2 py-0.5 text-xs font-semibold", styles[band])}>{band}</span>;
}

export function SlaBadge({ due }: { due?: string }) {
  if (!due) return <span className="text-xs text-slate-400">—</span>;
  const overdue = new Date(due).getTime() < Date.now();
  const soon = !overdue && new Date(due).getTime() - Date.now() < 12 * 3_600_000;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        overdue ? "bg-red-100 text-red-700" : soon ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700",
      )}
      title={`SLA due ${formatDateTime(due)}`}
    >
      {timeUntil(due)}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-md border border-qbe-grey-200 border-t-4 border-t-qbe-blue bg-white shadow-sm", className)}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-qbe-blue text-white hover:bg-qbe-blue-dark disabled:bg-qbe-grey-400",
    secondary: "border-2 border-qbe-blue bg-white text-qbe-blue hover:bg-qbe-grey-50 disabled:border-qbe-grey-200 disabled:text-qbe-grey-400",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-qbe-grey-400",
    ghost: "text-qbe-blue hover:bg-qbe-grey-100",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-qbe-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-qbe-body/80">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}
