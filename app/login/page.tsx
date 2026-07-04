"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("That password didn't work. Try again.");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="smtp-line inline-flex items-center gap-2 text-faint">
            <span className="smtp-code bg-line text-muted">220</span>
            <span>mailstats ready</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Sign in to MailStats</h1>
          <p className="mt-1 text-sm text-muted">Enter the dashboard password to continue.</p>
        </div>
        <form onSubmit={onSubmit} className="rounded-card border border-line bg-panel p-6 shadow-panel">
          <label className="block text-xs font-medium uppercase tracking-wide text-faint mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line2 bg-ink px-3 py-2 text-sm text-fg outline-none focus-visible:border-amber"
            placeholder="••••••••"
          />
          {error && <p className="mt-3 text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="mt-5 w-full rounded-md bg-amber px-3 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
