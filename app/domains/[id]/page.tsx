"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import StatsChart, { TimeseriesPoint } from "@/components/StatsChart";
import EventsTable, { MailEventRow } from "@/components/EventsTable";
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

  const loadDomain = useCallback(async () => {
    const res = await fetch(`/api/domains/${id}`);
    if (res.status === 404) {
      router.push("/");
      return;
    }
    setDomain(await res.json());
  }, [id, router]);

  const loadStats = useCallback(async () => {
    const res = await fetch(`/api/domains/${id}/stats?days=14`);
    setStats(await res.json());
  }, [id]);

  const loadEvents = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (filter) params.set("event_name", filter);
    if (search) params.set("q", search);
    const res = await fetch(`/api/domains/${id}/events?${params.toString()}`);
    const data = await res.json();
    setEvents(data.events);
    setTotalPages(data.totalPages);
  }, [id, page, filter, search]);

  useEffect(() => {
    loadDomain();
    loadStats();
  }, [loadDomain, loadStats]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

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

  return (
    <div>
      <Link href="/" className="text-xs text-faint hover:text-muted">
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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total events" value={totalEvents} />
        {stats.totals.slice(0, 3).map((t) => (
          <SummaryCard key={t.eventName} label={getEventMeta(t.eventName).label} value={t.count} />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted">Last 14 days</h2>
        <StatsChart timeseries={stats.timeseries} eventNames={eventNames} />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted">Event log</h2>
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
