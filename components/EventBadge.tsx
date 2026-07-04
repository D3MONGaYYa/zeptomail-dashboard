import { getEventMeta } from "@/lib/eventParser";

// Literal class strings (not built dynamically) so Tailwind's content scan
// picks them all up at build time.
const COLOR_CLASSES: Record<string, string> = {
  amber: "bg-amber/10 text-amber border-amber/30",
  red: "bg-red/10 text-red border-red/30",
  green: "bg-green/10 text-green border-green/30",
  blue: "bg-blue/10 text-blue border-blue/30",
  violet: "bg-violet/10 text-violet border-violet/30",
  muted: "bg-line text-muted border-line2",
  faint: "bg-line text-faint border-line2",
};

export default function EventBadge({ eventName }: { eventName: string }) {
  const meta = getEventMeta(eventName);
  const classes = COLOR_CLASSES[meta.color] ?? COLOR_CLASSES.muted;

  return (
    <span className="smtp-line inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`smtp-code border ${classes}`}>{meta.code}</span>
      <span className="text-muted">{meta.label}</span>
    </span>
  );
}
