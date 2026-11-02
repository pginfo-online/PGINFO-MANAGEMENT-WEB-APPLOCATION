import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "PgInfo — Production-Grade Property Management Platform",
  description:
    "Next-generation property management platform for PGs, hostels, flats, and co-living spaces in India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
