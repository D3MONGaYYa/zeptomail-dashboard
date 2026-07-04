import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "MailStats",
  description: "ZeptoMail webhook dashboard — bounces, deliveries and engagement per domain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-fg min-h-screen">
        <header className="border-b border-line">
          <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="smtp-code bg-panel2 text-amber border border-line2">250</span>
              <span className="font-semibold tracking-tight">MailStats</span>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
