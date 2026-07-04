"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail without HTTPS/permissions — fail quietly.
    }
  }

  return (
    <button
      onClick={onCopy}
      type="button"
      className="shrink-0 rounded-md border border-line2 bg-panel2 px-2.5 py-1 text-xs font-medium text-muted transition hover:text-fg hover:border-faint"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
