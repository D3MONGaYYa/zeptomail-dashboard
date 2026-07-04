"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import StatsChart, { TimeseriesPoint } from "@/components/StatsChart";
import StatsPieChart from "@/components/StatsPieChart";
import EventsTable, { MailEventRow } from "@/components/EventsTable";
import EventBadge from "@/components/EventBadge";
import { getEventMeta } from "@/lib/eventParser";

interface DomainDetail {
  id: number;
  name: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface StatsResponse {
  totals: { eventName: string; count: number }[];
  timeseries: TimeseriesPoint[];
}

interface EmailSummary {
  emailRef: string;
  subject: string | null;
  toAddresses: string[];
  eventNames: string[];
  status: string;
  lastEventAt: string;
}

type Tab = "stats" | "emails" | "events";

const DAYS_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

export default function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [events, setEvents] = useState<MailEventRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  const [days, setDays] = useState(14);

  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [emailPage, setEmailPage] = useState(1);
  const [emailTotalPages, setEmailTotalPages] = useState(1);

  const loadDomain = useCallback(async () => {
    const res = await fetch(`/api/domains/${id}`);
    if (res.status === 404) {
      router.push("/");
      return;
    }
    setDomain(await res.json());
  }, [id, router]);

  const loadStats = useCallback(async () => {
    const res = await fetch(`/api/domains/${id}/stats?days=${days}`);
    setStats(await res.json());
  }, [id, days]);

  const loadEvents = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (filter) params.set("event_name", filter);
    if (search) params.set("q", search);
    const res = await fetch(`/api/domains/${id}/events?${params.toString()}`);
    const data = await res.json();
    setEvents(data.events);
    setTotalPages(data.totalPages);
  }, [id, page, filter, search]);

  const loadEmails = useCallback(async () => {
    const params = new URLSearchParams({ page: String(emailPage), page_size: "20", domain_id: id });
    const res = await fetch(`/api/emails?${params.toString()}`);
    const data = await res.json();
    setEmails(data.emails);
    setEmailTotalPages(data.totalPages);
  }, [id, emailPage]);

  useEffect(() => {
    loadDomain();
  }, [loadDomain]);

  useEffect(() => {
    if (tab === "stats") loadStats();
  }, [loadStats, tab]);

  useEffect(() => {
    if (tab === "events") loadEvents();
  }, [loadEvents, tab]);

  useEffect(() => {
    if (tab === "emails") loadEmails();
  }, [loadEmails, tab]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    setEmailPage(1);
  }, [tab]);

  async function toggleActive() {
    if (!domain) return;
    setBusy(true);
    await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !domain.isActive }),
    });
    await loadDomain();
    setBusy(false);
  }

  async function regenerate() {
    if (!confirm("Roll this webhook URL? The old one will stop accepting events immediately — update ZeptoMail with the new one.")) {
      return;
    }
    setBusy(true);
    await fetch(`/api/domains/${id}/regenerate`, { method: "POST" });
    await loadDomain();
    setBusy(false);
  }

  async function deleteDomain() {
    if (!confirm(`Delete ${domain?.name} and all its recorded events? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    await fetch(`/api/domains/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (!domain || !stats) {
    return (
      <div className="smtp-line text-faint">
        <span className="smtp-code bg-line text-muted mr-2">220</span>
        loading…
      </div>
    );
  }

  const totalEvents = stats.totals.reduce((sum, t) => sum + t.count, 0);
  const eventNames = stats.totals.map((t) => t.eventName);

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "Stats & Charts" },
    { key: "emails", label: "Emails" },
    { key: "events", label: "Event Log" },
  ];

  return (
    <div>
      <Link href="/domains" className="text-xs text-faint hover:text-muted">
        ← All domains
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${domain.isActive ? "bg-green" : "bg-faint"}`} />
            <h1 className="font-mono text-lg font-semibold">{domain.name}</h1>
          </div>
          <p className="mt-1 text-xs text-faint">
            Added {new Date(domain.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleActive}
            disabled={busy}
            className="rounded-md border border-line2 bg-panel2 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-fg disabled:opacity-50"
          >
            {domain.isActive ? "Pause receiving" : "Resume receiving"}
          </button>
          <button
            onClick={deleteDomain}
            disabled={busy}
            className="rounded-md border border-red/30 bg-red/10 px-3 py-1.5 text-xs font-medium text-red transition hover:bg-red/20 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-faint">Webhook URL</span>
          <button onClick={regenerate} disabled={busy} className="text-xs text-faint hover:text-amber transition">
            Roll URL
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-line2 bg-ink px-3 py-2">
          <code className="flex-1 truncate text-xs text-fg">{domain.webhookUrl}</code>
          <CopyButton value={domain.webhookUrl} />
        </div>
        <p className="mt-2 text-xs text-faint">
          Set this as the webhook URL in ZeptoMail → Mail Agents → your agent → Webhooks.
        </p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-[1px] ${
              tab === t.key
                ? "border-amber text-fg"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {DAYS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    days === opt.value
                      ? "bg-line2 text-fg"
                      : "text-faint hover:text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total events" value={totalEvents} />
            {stats.totals.slice(0, 3).map((t) => (
              <SummaryCard key={t.eventName} label={getEventMeta(t.eventName).label} value={t.count} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted">Last {days} days</h2>
              <StatsChart timeseries={stats.timeseries} eventNames={eventNames} />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted">Event distribution</h2>
              <StatsPieChart data={stats.totals.map((t) => ({ name: t.eventName, count: t.count }))} />
            </div>
          </div>
        </div>
      )}

      {tab === "emails" && (
        <div className="mt-6">
          {emails.length === 0 ? (
            <div className="rounded-card border border-dashed border-line2 p-10 text-center">
              <p className="text-sm text-muted">No emails found for this domain.</p>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-panel divide-y divide-line">
              {emails.map((e) => (
                <Link
                  key={e.emailRef}
                  href={`/emails/${encodeURIComponent(e.emailRef)}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-line/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-fg truncate">{e.subject || "(no subject)"}</div>
                    <div className="text-xs text-faint truncate">{e.toAddresses[0] || "—"}</div>
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

          {emailTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <button
                onClick={() => setEmailPage(Math.max(1, emailPage - 1))}
                disabled={emailPage <= 1}
                className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
              >
                ← Prev
              </button>
              <span>Page {emailPage} of {emailTotalPages}</span>
              <button
                onClick={() => setEmailPage(Math.min(emailTotalPages, emailPage + 1))}
                disabled={emailPage >= emailTotalPages}
                className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="mt-6">
          <EventsTable
            events={events}
            eventOptions={eventNames}
            activeFilter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="font-mono text-xl font-semibold">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
