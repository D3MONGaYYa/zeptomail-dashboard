// ZeptoMail's webhook batches multiple events per request (`event_message[]`),
// and the shape of `event_data` differs per event type (bounces carry
// reason/diagnostic details, delivery/engagement events don't). This parser
// normalizes whatever comes in into flat rows, and always keeps the raw
// message so nothing is lost even for event types we haven't special-cased.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NormalizedEvent {
  event_name: string;
  request_id: string | null;
  webhook_request_id: string | null;
  subject: string | null;
  from_address: string | null;
  to_addresses: string[];
  client_reference: string | null;
  email_reference: string | null;
  recipient: string | null;
  reason: string | null;
  diagnostic_message: string | null;
  processed_time: string | null;
  raw_payload: unknown;
}

export function normalizeZeptoWebhook(body: any): NormalizedEvent[] {
  const results: NormalizedEvent[] = [];
  const topEventNames: string[] = Array.isArray(body?.event_name) ? body.event_name : [];
  const webhookRequestId: string | null = body?.webhook_request_id ?? null;
  const messages: any[] = Array.isArray(body?.event_message) ? body.event_message : [];

  for (const msg of messages) {
    const emailInfo = msg?.email_info ?? {};
    const eventDataArr: any[] = Array.isArray(msg?.event_data) ? msg.event_data : [];
    const requestId: string | null = msg?.request_id ?? null;

    const toAddresses: string[] = Array.isArray(emailInfo?.to)
      ? emailInfo.to.map((t: any) => t?.email_address?.address).filter(Boolean)
      : [];

    const base = {
      request_id: requestId,
      webhook_request_id: webhookRequestId,
      subject: emailInfo?.subject ?? null,
      from_address: emailInfo?.from?.address ?? null,
      to_addresses: toAddresses,
      client_reference: emailInfo?.client_reference ?? null,
      email_reference: emailInfo?.email_reference ?? null,
      processed_time: emailInfo?.processed_time ?? null,
    };

    if (eventDataArr.length === 0) {
      results.push({
        ...base,
        event_name: topEventNames[0] ?? "unknown",
        recipient: null,
        reason: null,
        diagnostic_message: null,
        raw_payload: msg,
      });
      continue;
    }

    for (const ed of eventDataArr) {
      const eventName: string = ed?.object || topEventNames[0] || "unknown";
      const details: any[] = Array.isArray(ed?.details) ? ed.details : [];

      if (details.length === 0) {
        results.push({
          ...base,
          event_name: eventName,
          recipient: null,
          reason: null,
          diagnostic_message: null,
          raw_payload: msg,
        });
        continue;
      }

      for (const d of details) {
        results.push({
          ...base,
          event_name: eventName,
          recipient: d?.bounced_recipient || d?.recipient || d?.email_address || null,
          reason: d?.reason ?? null,
          diagnostic_message: d?.diagnostic_message ?? null,
          raw_payload: msg,
        });
      }
    }
  }

  return results;
}

// Display metadata for each known event type, styled as an SMTP transcript
// line — real reply codes for delivery-path events, plain word-codes for
// engagement events that were never actually SMTP responses.
export const EVENT_META: Record<
  string,
  { label: string; code: string; color: string; group: "delivery" | "bounce" | "engagement" | "other" }
> = {
  delivered: { label: "Delivered", code: "250", color: "green", group: "delivery" },
  processed: { label: "Processed", code: "220", color: "muted", group: "delivery" },
  softbounce: { label: "Soft bounce", code: "421", color: "amber", group: "bounce" },
  hardbounce: { label: "Hard bounce", code: "550", color: "red", group: "bounce" },
  bounced: { label: "Bounced", code: "550", color: "red", group: "bounce" },
  dropped: { label: "Dropped", code: "554", color: "red", group: "bounce" },
  opened: { label: "Opened", code: "OPEN", color: "blue", group: "engagement" },
  clicked: { label: "Clicked", code: "CLICK", color: "violet", group: "engagement" },
  unsubscribed: { label: "Unsubscribed", code: "UNSUB", color: "faint", group: "engagement" },
  unsubscribe: { label: "Unsubscribed", code: "UNSUB", color: "faint", group: "engagement" },
  spamcomplaints: { label: "Spam complaint", code: "SPAM", color: "red", group: "other" },
};

export function getEventMeta(eventName: string) {
  return (
    EVENT_META[eventName] ?? {
      label: eventName || "Unknown",
      code: "???",
      color: "muted",
      group: "other" as const,
    }
  );
}
