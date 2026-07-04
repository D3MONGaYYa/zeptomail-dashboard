import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "MailStats",
  description: "ZeptoMail webhook dashboard — bounces, deliveries and engagement per domain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-fg min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-6 py-8 md:px-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
