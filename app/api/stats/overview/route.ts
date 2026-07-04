import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const domainCountResult = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM domains"
  );
  const domainCount = Number(domainCountResult.rows[0]?.count ?? 0);

  const totalsResult = await query<{ total_events: string; total_bounces: string }>(
    `SELECT
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE event_name IN ('softbounce','hardbounce','bounced','dropped')) AS total_bounces
     FROM mail_events`
  );
  const totalEvents = Number(totalsResult.rows[0]?.total_events ?? 0);
  const totalBounces = Number(totalsResult.rows[0]?.total_bounces ?? 0);
  const bounceRate = totalEvents > 0 ? Math.round((totalBounces / totalEvents) * 10000) / 100 : 0;

  const last7dResult = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM mail_events WHERE received_at >= now() - '7 days'::interval"
  );
  const eventsLast7d = Number(last7dResult.rows[0]?.count ?? 0);

  const mostBouncedResult = await query<{
    id: number;
    name: string;
    total_events: string;
    bounce_events: string;
  }>(
    `SELECT
       d.id, d.name,
       COUNT(e.id) AS total_events,
       COUNT(e.id) FILTER (WHERE e.event_name IN ('softbounce','hardbounce','bounced','dropped')) AS bounce_events
     FROM domains d
     JOIN mail_events e ON e.domain_id = d.id
     GROUP BY d.id, d.name
     HAVING COUNT(e.id) > 0
     ORDER BY bounce_events DESC
     LIMIT 1`
  );
  const mostBouncedDomain = mostBouncedResult.rows[0]
    ? {
        id: mostBouncedResult.rows[0].id,
        name: mostBouncedResult.rows[0].name,
        bounceCount: Number(mostBouncedResult.rows[0].bounce_events),
        bounceRate:
          Number(mostBouncedResult.rows[0].total_events) > 0
            ? Math.round(
                (Number(mostBouncedResult.rows[0].bounce_events) /
                  Number(mostBouncedResult.rows[0].total_events)) *
                  10000
              ) / 100
            : 0,
      }
    : null;

  const perDomainStatsResult = await query<{
    id: number;
    name: string;
    total_events: string;
    bounce_events: string;
    last_event_at: string | null;
  }>(
    `SELECT
       d.id, d.name,
       COUNT(e.id) AS total_events,
       COUNT(e.id) FILTER (WHERE e.event_name IN ('softbounce','hardbounce','bounced','dropped')) AS bounce_events,
       MAX(e.received_at) AS last_event_at
     FROM domains d
     LEFT JOIN mail_events e ON e.domain_id = d.id
     GROUP BY d.id, d.name
     ORDER BY total_events DESC`
  );
  const perDomainStats = perDomainStatsResult.rows.map((r) => ({
    id: r.id,
    name: r.name,
    totalEvents: Number(r.total_events),
    bounceEvents: Number(r.bounce_events),
    lastEventAt: r.last_event_at,
  }));

  const distributionResult = await query<{ event_name: string; count: string }>(
    `SELECT event_name, COUNT(*) AS count
     FROM mail_events
     GROUP BY event_name
     ORDER BY count DESC`
  );
  const eventDistribution = distributionResult.rows.map((r) => ({
    name: r.event_name,
    count: Number(r.count),
  }));

  const recentResult = await query<{
    id: number;
    event_name: string;
    recipient: string | null;
    subject: string | null;
    domain_name: string;
    domain_id: number;
    received_at: string;
  }>(
    `SELECT
       e.id, e.event_name, e.recipient, e.subject,
       d.name AS domain_name, d.id AS domain_id,
       e.received_at
     FROM mail_events e
     JOIN domains d ON d.id = e.domain_id
     ORDER BY e.received_at DESC
     LIMIT 10`
  );
  const recentEvents = recentResult.rows.map((r) => ({
    id: r.id,
    eventName: r.event_name,
    recipient: r.recipient,
    subject: r.subject,
    domainName: r.domain_name,
    domainId: r.domain_id,
    receivedAt: r.received_at,
  }));

  return NextResponse.json({
    domainCount,
    totalEvents,
    totalBounces,
    bounceRate,
    eventsLast7d,
    mostBouncedDomain,
    perDomainStats,
    eventDistribution,
    recentEvents,
  });
}
