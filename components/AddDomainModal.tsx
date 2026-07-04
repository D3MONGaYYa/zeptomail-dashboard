"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

export default function AddDomainModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; webhookUrl: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setResult(data);
    onCreated();
  }

  function onDone() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-panel p-6 shadow-panel fade-in">
        {!result ? (
          <>
            <h2 className="text-base font-semibold">Track a new domain</h2>
            <p className="mt-1 text-sm text-muted">
              Give it the sending domain's name. You'll get a unique webhook URL to paste into
              ZeptoMail right after.
            </p>
            <form onSubmit={onSubmit} className="mt-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-faint mb-2" htmlFor="domain">
                Domain
              </label>
              <input
                id="domain"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="portal.cicra.edu.lk"
                className="w-full rounded-md border border-line2 bg-ink px-3 py-2 text-sm font-mono text-fg outline-none focus-visible:border-amber"
              />
              {error && <p className="mt-2 text-sm text-red">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-3 py-2 text-sm text-muted hover:text-fg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name}
                  className="rounded-md bg-amber px-3 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create webhook"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="smtp-line inline-flex items-center gap-2 text-green">
              <span className="smtp-code border bg-green/10 text-green border-green/30">250</span>
              <span>domain added</span>
            </div>
            <h2 className="mt-3 text-base font-semibold">Paste this into ZeptoMail</h2>
            <p className="mt-1 text-sm text-muted">
              In ZeptoMail, go to Mail Agents → your agent → Webhooks, and set the URL below for
              the events you want (bounces, delivered, opened, clicked, etc.).
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-line2 bg-ink px-3 py-2">
              <code className="flex-1 truncate text-xs text-fg">{result.webhookUrl}</code>
              <CopyButton value={result.webhookUrl} />
            </div>
            <p className="mt-3 text-xs text-faint">
              This URL is the only credential — keep it private. You can roll it any time from the
              domain page if it leaks.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={onDone}
                className="rounded-md bg-amber px-3 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
