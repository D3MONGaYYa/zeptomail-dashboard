"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import EventBadge from "@/components/EventBadge";

interface EmailSummary {
  emailRef: string;
  subject: string | null;
  fromAddress: string | null;
  toAddresses: string[];
  domainId: number;
  domainName: string;
  eventNames: string[];
  eventCount: number;
  firstEventAt: string;
  lastEventAt: string;
  status: "delivered" | "bounced" | "pending";
}

function EmailList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");
  const domainId = searchParams.get("domain_id") || "";

  const [data, setData] = useState<{
    emails: EmailSummary[];
    totalPages: number;
  } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "25" });
    if (domainId) params.set("domain_id", domainId);
    const res = await fetch(`/api/emails?${params.toString()}`);
    setData(await res.json());
  }, [page, domainId]);

  useEffect(() => {
    load();
  }, [load]);

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/emails?${params.toString()}`);
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "delivered": return "text-green";
      case "bounced": return "text-red";
      default: return "text-faint";
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight mb-6">Emails</h1>

      {data === null && (
        <div className="smtp-line text-faint">
          <span className="smtp-code bg-line text-muted mr-2">220</span>
          loading…
        </div>
      )}

      {data && data.emails.length === 0 && (
        <div className="rounded-card border border-dashed border-line2 p-10 text-center">
          <p className="text-sm text-muted">No emails found.</p>
        </div>
      )}

      {data && data.emails.length > 0 && (
        <div className="rounded-card border border-line bg-panel divide-y divide-line">
          {data.emails.map((e) => (
            <Link
              key={e.emailRef}
              href={`/emails/${encodeURIComponent(e.emailRef)}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-line/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-semibold ${statusColor(e.status)}`}>
                    {e.status}
                  </span>
                  <span className="text-sm text-fg truncate">
                    {e.subject || "(no subject)"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-faint truncate">
                  {e.toAddresses[0] || "—"} · {e.domainName}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {e.eventNames.slice(0, 3).map((n) => (
                  <EventBadge key={n} eventName={n} />
                ))}
              </div>
              <span className="text-xs text-faint shrink-0">
                {new Date(e.lastEventAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= data.totalPages}
            className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={
      <div className="smtp-line text-faint">
        <span className="smtp-code bg-line text-muted mr-2">220</span>
        loading…
      </div>
    }>
      <EmailList />
    </Suspense>
  );
}
