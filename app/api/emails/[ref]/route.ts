import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { ref: string } }
) {
  const emailRef = decodeURIComponent(params.ref);

  const eventsResult = await query<{
    id: number;
    event_name: string;
    subject: string | null;
    from_address: string | null;
    to_addresses: string[];
    client_reference: string | null;
    recipient: string | null;
    reason: string | null;
    diagnostic_message: string | null;
    processed_time: string | null;
    received_at: string;
    domain_id: number;
    domain_name: string;
  }>(
    `SELECT
       e.id, e.event_name, e.subject, e.from_address, e.to_addresses,
       e.client_reference, e.recipient, e.reason, e.diagnostic_message,
       e.processed_time, e.received_at,
       d.id AS domain_id, d.name AS domain_name
     FROM mail_events e
     JOIN domains d ON d.id = e.domain_id
     WHERE e.email_reference = $1
     ORDER BY e.received_at ASC`,
    [emailRef]
  );

  if (eventsResult.rows.length === 0) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  const events = eventsResult.rows.map((r) => ({
    id: r.id,
    eventName: r.event_name,
    subject: r.subject,
    fromAddress: r.from_address,
    toAddresses: r.to_addresses,
    clientReference: r.client_reference,
    recipient: r.recipient,
    reason: r.reason,
    diagnosticMessage: r.diagnostic_message,
    processedTime: r.processed_time,
    receivedAt: r.received_at,
  }));

  const first = eventsResult.rows[0];
  const eventNames = events.map((e) => e.eventName);
  const hasDelivered = eventNames.includes("delivered");
  const hasBounced = eventNames.some((n) =>
    ["softbounce", "hardbounce", "bounced", "dropped"].includes(n)
  );
  const hasOpened = eventNames.includes("opened");
  const hasClicked = eventNames.includes("clicked");

  const deliveredEvent = events.find((e) => e.eventName === "delivered");
  const firstOpenedEvent = events.find((e) => e.eventName === "opened");

  return NextResponse.json({
    emailRef,
    subject: first.subject,
    fromAddress: first.from_address,
    toAddresses: first.to_addresses,
    clientReference: first.client_reference,
    domainId: first.domain_id,
    domainName: first.domain_name,
    status: hasBounced ? "bounced" : hasDelivered ? "delivered" : "pending",
    summary: {
      totalEvents: events.length,
      delivered: hasDelivered,
      bounced: hasBounced,
      opened: hasOpened,
      clicked: hasClicked,
      timeToDeliver:
        deliveredEvent && first.processed_time
          ? msToDuration(
              new Date(deliveredEvent.receivedAt).getTime() -
                new Date(first.processed_time).getTime()
            )
          : null,
      timeToFirstOpen:
        firstOpenedEvent && deliveredEvent
          ? msToDuration(
              new Date(firstOpenedEvent.receivedAt).getTime() -
                new Date(deliveredEvent.receivedAt).getTime()
            )
          : null,
      bounceReason: events.find((e) => e.reason)?.reason ?? null,
      bounceDiagnostic: events.find((e) => e.diagnosticMessage)?.diagnosticMessage ?? null,
    },
    events,
  });
}

function msToDuration(ms: number): string {
  if (ms < 0) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
