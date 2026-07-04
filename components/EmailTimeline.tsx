import EventBadge from "./EventBadge";

interface TimelineEvent {
  id: number;
  eventName: string;
  recipient: string | null;
  reason: string | null;
  diagnosticMessage: string | null;
  processedTime: string | null;
  receivedAt: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function EmailTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-4 pb-6 last:pb-0 relative">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-line2 bg-panel z-10" />
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-line mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0 -mt-1">
            <div className="flex items-center gap-2">
              <EventBadge eventName={e.eventName} />
              <span className="text-xs text-faint">{formatTime(e.receivedAt)}</span>
            </div>
            {e.recipient && (
              <div className="mt-1 text-xs text-fg">{e.recipient}</div>
            )}
            {(e.reason || e.diagnosticMessage) && (
              <div className="mt-1 text-xs text-faint">
                {e.reason && <span className="mr-2">reason: {e.reason}</span>}
                {e.diagnosticMessage && <span>{e.diagnosticMessage}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
