"use client";

import Link from "next/link";
import EventBadge from "./EventBadge";
import { getEventMeta } from "@/lib/eventParser";

export interface MailEventRow {
  id: number;
  event_name: string;
  subject: string | null;
  from_address: string | null;
  to_addresses: string[];
  client_reference: string | null;
  email_reference: string | null;
  recipient: string | null;
  reason: string | null;
  diagnostic_message: string | null;
  processed_time: string | null;
  received_at: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function EventsTable({
  events,
  eventOptions,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: {
  events: MailEventRow[];
  eventOptions: string[];
  activeFilter: string;
  onFilterChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="rounded-card border border-line bg-panel">
      <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onFilterChange("")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeFilter === "" ? "bg-line2 text-fg" : "text-faint hover:text-muted"
            }`}
          >
            All
          </button>
          {eventOptions.map((name) => (
            <button
              key={name}
              onClick={() => onFilterChange(name)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                activeFilter === name ? "bg-line2 text-fg" : "text-faint hover:text-muted"
              }`}
            >
              {getEventMeta(name).label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recipient, subject, reference…"
          className="w-full max-w-xs rounded-md border border-line2 bg-ink px-2.5 py-1.5 text-xs text-fg outline-none focus-visible:border-amber sm:w-64"
        />
      </div>

      <div className="divide-y divide-line">
        {events.length === 0 && (
          <div className="p-8 text-center text-sm text-faint">No events match this filter.</div>
        )}
        {events.map((e) => (
          <div key={e.id} className="smtp-line fade-in p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-faint">{formatTime(e.received_at)}</span>
              <EventBadge eventName={e.event_name} />
              <span className="text-fg">{e.recipient || e.to_addresses?.[0] || "—"}</span>
              {e.client_reference && <span className="text-faint">ref: {e.client_reference}</span>}
              {e.email_reference && (
                <Link
                  href={`/emails/${encodeURIComponent(e.email_reference)}`}
                  className="ml-auto text-xs text-faint hover:text-amber transition"
                >
                  Report →
                </Link>
              )}
            </div>
            {(e.subject || e.reason || e.diagnostic_message) && (
              <div className="mt-1 pl-[4.5rem] text-faint">
                {e.subject && <span className="mr-3">&ldquo;{e.subject}&rdquo;</span>}
                {e.reason && <span className="mr-3">reason: {e.reason}</span>}
                {e.diagnostic_message && <span>{e.diagnostic_message}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line p-3 text-xs text-muted">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1 hover:text-fg disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
