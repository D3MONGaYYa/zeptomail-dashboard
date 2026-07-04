"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import EmailTimeline from "@/components/EmailTimeline";

interface EmailEvent {
  id: number;
  eventName: string;
  subject: string | null;
  fromAddress: string | null;
  toAddresses: string[];
  clientReference: string | null;
  recipient: string | null;
  reason: string | null;
  diagnosticMessage: string | null;
  processedTime: string | null;
  receivedAt: string;
}

interface EmailReport {
  emailRef: string;
  subject: string | null;
  fromAddress: string | null;
  toAddresses: string[];
  clientReference: string | null;
  domainId: number;
  domainName: string;
  status: string;
  summary: {
    totalEvents: number;
    delivered: boolean;
    bounced: boolean;
    opened: boolean;
    clicked: boolean;
    timeToDeliver: string | null;
    timeToFirstOpen: string | null;
    bounceReason: string | null;
    bounceDiagnostic: string | null;
  };
  events: EmailEvent[];
}

export default function EmailDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const [report, setReport] = useState<EmailReport | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/emails/${encodeURIComponent(ref)}`);
    if (res.ok) setReport(await res.json());
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  if (!report) {
    return (
      <div className="smtp-line text-faint">
        <span className="smtp-code bg-line text-muted mr-2">220</span>
        loading…
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green/20 text-green border-green/30",
      bounced: "bg-red/20 text-red border-red/30",
      pending: "bg-faint/20 text-faint border-faint/30",
    };
    return (
      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${colors[s] ?? colors.pending}`}>
        {s}
      </span>
    );
  };

  return (
    <div>
      <Link href="/emails" className="text-xs text-faint hover:text-muted">
        ← All emails
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">{report.subject || "(no subject)"}</h1>
            {statusBadge(report.status)}
          </div>
          <p className="mt-1 text-sm text-faint">
            From: {report.fromAddress || "—"} &middot; To: {report.toAddresses[0] || "—"}
          </p>
          <p className="text-xs text-faint">
            Domain: <Link href={`/domains/${report.domainId}`} className="hover:text-amber">{report.domainName}</Link>
            &middot; Ref: {report.clientReference || "—"}
          </p>
        </div>
      </div>

      {report.summary.totalEvents > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total events" value={report.summary.totalEvents} />
          <SummaryCard label="Time to deliver" value={report.summary.timeToDeliver ?? "—"} />
          <SummaryCard label="First open" value={report.summary.timeToFirstOpen ?? "—"} />
          <SummaryCard label="Email ref" value={report.emailRef.slice(0, 12) + "…"} />
        </div>
      )}

      {report.summary.bounceReason && (
        <div className="mt-4 rounded-card border border-red/30 bg-red/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-red">Bounce info</div>
          <p className="mt-1 text-sm text-fg">{report.summary.bounceReason}</p>
          {report.summary.bounceDiagnostic && (
            <p className="mt-1 text-xs text-faint">{report.summary.bounceDiagnostic}</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted">Event timeline</h2>
        <div className="rounded-card border border-line bg-panel p-4">
          <EmailTimeline events={report.events} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="font-mono text-lg font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
