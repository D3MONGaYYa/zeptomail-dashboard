"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onLogout}
      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-line/50 hover:text-fg"
    >
      Sign out
    </button>
  );
}
