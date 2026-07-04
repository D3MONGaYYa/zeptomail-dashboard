"use client";

import { useEffect, useState, useCallback } from "react";
import DomainCard, { DomainSummary } from "@/components/DomainCard";
import AddDomainModal from "@/components/AddDomainModal";

export default function HomePage() {
  const [domains, setDomains] = useState<DomainSummary[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/domains");
    const data = await res.json();
    setDomains(data.domains);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Domains</h1>
          <p className="mt-1 text-sm text-muted">
            One webhook URL per domain. Point ZeptoMail's Mail Agent webhooks at it.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-amber px-3.5 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          + Add domain
        </button>
      </div>

      {domains === null && (
        <div className="smtp-line text-faint">
          <span className="smtp-code bg-line text-muted mr-2">220</span>
          loading domains…
        </div>
      )}

      {domains?.length === 0 && (
        <div className="rounded-card border border-dashed border-line2 p-10 text-center">
          <p className="text-sm text-muted">No domains tracked yet.</p>
          <p className="mt-1 text-xs text-faint">
            Add one to get a unique webhook URL you can paste into ZeptoMail.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-md bg-amber px-3.5 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            + Add domain
          </button>
        </div>
      )}

      {domains && domains.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => (
            <DomainCard key={d.id} domain={d} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddDomainModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            load();
          }}
        />
      )}
    </div>
  );
}
