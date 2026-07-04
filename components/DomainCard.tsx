import Link from "next/link";
import CopyButton from "./CopyButton";

export interface DomainSummary {
  id: number;
  name: string;
  webhookUrl: string;
  isActive: boolean;
  totalEvents: number;
  bounceEvents: number;
  lastEventAt: string | null;
}

function timeAgo(iso: string | null) {
  if (!iso) return "no events yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DomainCard({ domain }: { domain: DomainSummary }) {
  const bounceRate =
    domain.totalEvents > 0 ? Math.round((domain.bounceEvents / domain.totalEvents) * 100) : null;

  return (
    <Link
      href={`/domains/${domain.id}`}
      className="group block rounded-card border border-line bg-panel p-5 shadow-panel transition hover:border-line2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${domain.isActive ? "bg-green" : "bg-faint"}`}
              aria-hidden
            />
            <h3 className="truncate font-mono text-sm font-medium text-fg">{domain.name}</h3>
          </div>
          <p className="mt-1 text-xs text-faint">{timeAgo(domain.lastEventAt)}</p>
        </div>
        {bounceRate !== null && (
          <div className="text-right shrink-0">
            <div className={`font-mono text-lg font-semibold ${bounceRate > 5 ? "text-amber" : "text-fg"}`}>
              {bounceRate}%
            </div>
            <div className="text-[10px] uppercase tracking-wide text-faint">bounce rate</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{domain.totalEvents.toLocaleString()} events</span>
        <span>{domain.bounceEvents.toLocaleString()} bounced</span>
      </div>

      <div
        className="mt-4 flex items-center gap-2 rounded-md border border-line2 bg-panel2 px-2.5 py-1.5"
        onClick={(e) => e.preventDefault()}
      >
        <code className="flex-1 truncate text-[11px] text-faint">{domain.webhookUrl}</code>
        <CopyButton value={domain.webhookUrl} />
      </div>
    </Link>
  );
}
