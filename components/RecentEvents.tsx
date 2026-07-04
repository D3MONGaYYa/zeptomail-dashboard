import Link from "next/link";
import EventBadge from "./EventBadge";

interface RecentEvent {
  id: number;
  eventName: string;
  recipient: string | null;
  subject: string | null;
  domainName: string;
  domainId: number;
  receivedAt: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentEvents({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-card border border-line bg-panel p-8 text-center text-sm text-faint">
        No events yet.
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-panel divide-y divide-line">
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-3 px-4 py-3">
          <EventBadge eventName={e.eventName} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-fg truncate">
              {e.recipient || "—"}
            </div>
            <div className="text-xs text-faint truncate">
              {e.subject ? `"${e.subject}"` : ""}
              <Link href={`/domains/${e.domainId}`} className="ml-2 hover:text-amber">
                {e.domainName}
              </Link>
            </div>
          </div>
          <span className="text-xs text-faint shrink-0">{timeAgo(e.receivedAt)}</span>
        </div>
      ))}
    </div>
  );
}
