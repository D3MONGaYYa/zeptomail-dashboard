"use client";

import { useEffect, useState } from "react";
import StatsPieChart from "@/components/StatsPieChart";
import DomainBarChart from "@/components/DomainBarChart";
import RecentEvents from "@/components/RecentEvents";
import { getEventMeta } from "@/lib/eventParser";

interface OverviewStats {
  domainCount: number;
  totalEvents: number;
  totalBounces: number;
  bounceRate: number;
  eventsLast7d: number;
  mostBouncedDomain: {
    id: number;
    name: string;
    bounceCount: number;
    bounceRate: number;
  } | null;
  perDomainStats: {
    id: number;
    name: string;
    totalEvents: number;
    bounceEvents: number;
    lastEventAt: string | null;
  }[];
  eventDistribution: { name: string; count: number }[];
  recentEvents: {
    id: number;
    eventName: string;
    recipient: string | null;
    subject: string | null;
    domainName: string;
    domainId: number;
    receivedAt: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="smtp-line text-faint">
        <span className="smtp-code bg-line text-muted mr-2">220</span>
        loading…
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight mb-6">Overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Domains" value={stats.domainCount} />
        <SummaryCard label="Total events" value={stats.totalEvents} />
        <SummaryCard label="Bounce rate" value={`${stats.bounceRate}%`} />
        <SummaryCard label="Events (7d)" value={stats.eventsLast7d} />
      </div>

      {stats.mostBouncedDomain && (
        <div className="mt-4 rounded-card border border-red/30 bg-red/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-red">Most bounced domain</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-lg font-semibold text-fg">{stats.mostBouncedDomain.name}</span>
            <span className="font-mono text-sm text-red">{stats.mostBouncedDomain.bounceCount} bounces</span>
            <span className="text-xs text-faint">({stats.mostBouncedDomain.bounceRate}%)</span>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted">Event distribution</h2>
          <StatsPieChart data={stats.eventDistribution} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted">Events per domain</h2>
          <DomainBarChart data={stats.perDomainStats} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted">Latest triggers</h2>
        <RecentEvents events={stats.recentEvents} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="font-mono text-xl font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
