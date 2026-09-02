"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileUp } from "lucide-react";
import { useStore, assessorQueue } from "@/lib/store";
import { Card } from "@/components/ui";

export default function Home() {
  const { state, setRole } = useStore();
  const myClaims = state.claims.filter((c) => c.policyholder === state.currentUser.policyholder);
  const queue = assessorQueue(state);

  return (
    <div>
      <div className="relative mb-10 overflow-hidden rounded-md bg-qbe-navy px-8 py-12 text-white">
        <div className="absolute inset-y-0 left-0 w-2 bg-qbe-orange" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-qbe-blue/40" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5FB9EF]">Claims · Demo</p>
          <h1 className="mt-2 text-4xl font-medium leading-tight tracking-tight !text-white">
            Claim document upload &amp; assessor review
          </h1>
          <p className="mt-4 text-white/85">
            An end-to-end insurance workflow: a policyholder uploads supporting evidence against an open claim, the
            document is validated and routed to a prioritised assessor queue, the assessor reviews it inline and records
            a decision, and the policyholder is notified — with every step captured in an immutable audit trail.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-qbe-blue/10 p-2 text-qbe-blue">
              <FileUp className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Policyholder</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Signed in as <strong>{state.currentUser.policyholder}</strong> with {myClaims.length} claims. Upload
            invoices, estimates, photos and medical reports; respond to assessor requests; track outcomes.
          </p>
          <Link
            href="/claims"
            onClick={() => setRole("policyholder")}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-qbe-blue hover:underline"
          >
            Go to my claims <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-qbe-orange/15 p-2 text-qbe-orange">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Claims assessor</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Signed in as <strong>{state.currentUser.assessor}</strong>. {queue.length} claim
            {queue.length === 1 ? "" : "s"} waiting in the queue, prioritised by claim value, age and SLA. Review
            documents inline and record Accept / Reject / More Info decisions.
          </p>
          <Link
            href="/queue"
            onClick={() => setRole("assessor")}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-qbe-blue hover:underline"
          >
            Open work queue <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="font-semibold">Suggested demo script</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
          <li>As policyholder, open <em>CLM-2026-1001</em> and upload a PDF or image — it lands as “Pending Review”.</li>
          <li>Try a <code>.exe</code>, a file over 20 MB, or a file named <code>virus.pdf</code> to see validation and the mock malware scan reject it.</li>
          <li>Switch to assessor: the claim now sits in the queue with an SLA due date and priority.</li>
          <li>Open it, view the document inline, and Accept / Reject (reason code required) / request more info.</li>
          <li>Switch back to policyholder: an in-app + email notification explains the outcome and next action.</li>
          <li>Upload a replacement for a rejected document — it becomes version 2, supersedes v1 and re-enters the queue with the original SLA.</li>
          <li>Check the audit log for actor, timestamp, action, version and reason on every event.</li>
        </ol>
      </Card>
    </div>
  );
}
